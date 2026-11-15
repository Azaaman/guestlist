// GET the live state of a party. Polled by the big screen and by every phone.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash, loadCases, loadState, type ActionRow } from "@/lib/live";
import { REPORT_REASONS } from "@/lib/room";

export const dynamic = "force-dynamic";

const avg = (xs: number[]) =>
  xs.length ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 10) / 10 : null;

export async function GET(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  try {
    const { sid } = await params;
    const playerId = new URL(req.url).searchParams.get("player");
    const state = await loadState(sid);
    const [{ data: players }, { data: actions }] = await Promise.all([
      db().from("live_players").select("id,name,gender,created_at").eq("session_id", sid).order("created_at"),
      db()
        .from("live_actions")
        .select("player_id,contest_index,question_index,kind,target_pair,value")
        .eq("session_id", sid),
    ]);
    const acts = (actions ?? []) as ActionRow[];
    const nameOf = (id: string) => state.people.find((p) => p.id === id)?.name ?? "Guest";
    const present = state.people.filter((p) => !state.banned.includes(p.id));
    // Cases are only read when someone has actually been removed.
    const cases = state.banned.length ? (await loadCases()).filter((c) => c.sid === sid) : [];
    const caseOf = (id: string) => cases.find((c) => c.personId === id);

    // Open reports about guests, grouped by guest. Shown to the host on the big screen.
    // Reports about the host are not here: they go straight to Nestly.
    const byTarget = new Map<string, ActionRow[]>();
    for (const a of acts.filter((x) => x.kind === "report" && x.target_pair !== "host")) {
      if (state.banned.includes(a.target_pair) || state.dismissed.includes(a.target_pair)) continue;
      byTarget.set(a.target_pair, [...(byTarget.get(a.target_pair) ?? []), a]);
    }
    const reports = [...byTarget.entries()].map(([id, rows]) => ({
      id,
      name: nameOf(id),
      count: new Set(rows.map((r) => r.player_id)).size,
      reasons: [...new Set(rows.map((r) => REPORT_REASONS[r.value] ?? REPORT_REASONS[3]))],
    }));

    const pulses = acts.filter((a) => a.kind === "pulse").map((a) => a.value);
    const hostRatings = acts.filter((a) => a.kind === "rate" && a.target_pair === "host").map((a) => a.value);
    const partyRatings = acts
      .filter((a) => a.kind === "rate" && a.target_pair === "party")
      .map((a) => a.value);
    const room = {
      vibe: avg(pulses),
      vibeCount: pulses.length,
      met: acts.filter((a) => a.kind === "met").length,
      reports,
      removed: state.banned.map((id) => {
        const c = caseOf(id);
        return { id, name: nameOf(id), status: c?.status ?? "open", outcome: c?.outcome ?? null };
      }),
      damage: Object.entries(state.damage).map(([id, d]) => ({ id, name: nameOf(id), ...d })),
      partyRating: avg(partyRatings),
      hostRating: avg(hostRatings),
      ratingCount: hostRatings.length,
    };

    let me = null;
    if (playerId) {
      const all = acts.filter((a) => a.player_id === playerId);
      const again = all.filter((a) => a.kind === "again").map((a) => a.target_pair);
      // A match needs both sides. Simulated members answer with a fixed coin-flip.
      const matches = again
        .map((id) => present.find((x) => x.id === id))
        .filter((x): x is NonNullable<typeof x> => !!x)
        .filter((x) =>
          x.demo
            ? hash(`again:${x.id}:${playerId}`) < 0.6
            : acts.some((a) => a.kind === "again" && a.player_id === x.id && a.target_pair === playerId),
        )
        .map((x) => ({ id: x.id, name: x.name, demo: x.demo }));
      const c = caseOf(playerId);
      me = {
        removed: state.banned.includes(playerId),
        conduct: c
          ? { status: c.status, reasons: c.reasons, appealed: !!c.appeal, outcome: c.outcome ?? null }
          : null,
        damage: state.damage[playerId] ?? null,
        intros: (state.intros[playerId] ?? [])
          .filter((i) => !state.banned.includes(i.id))
          .map((i) => ({ ...i, name: nameOf(i.id) })),
        met: all.filter((a) => a.kind === "met").map((a) => a.target_pair),
        reported: all.filter((a) => a.kind === "report").map((a) => a.target_pair),
        pulse: all.find((a) => a.kind === "pulse")?.value ?? null,
        rates: Object.fromEntries(all.filter((a) => a.kind === "rate").map((a) => [a.target_pair, a.value])),
        again,
        matches,
      };
    }

    return NextResponse.json({
      status: state.status,
      people: present.map((p) => ({ id: p.id, name: p.name, demo: p.demo })),
      players: players ?? [],
      room,
      me,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
