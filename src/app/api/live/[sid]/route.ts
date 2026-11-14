import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeScores, hash, loadState, type ActionRow } from "@/lib/live";

export const dynamic = "force-dynamic";

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 10) / 10 : null);

export async function GET(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  try {
    const { sid } = await params;
    const playerId = new URL(req.url).searchParams.get("player");
    const state = await loadState(sid);
    const [{ data: players }, { data: actions }] = await Promise.all([
      db().from("live_players").select("id,name,gender,skill,created_at").eq("session_id", sid).order("created_at"),
      db().from("live_actions").select("player_id,contest_index,question_index,kind,target_pair,value").eq("session_id", sid),
    ]);
    const acts = (actions ?? []) as ActionRow[];
    const scores = computeScores(state, acts);

    // How many phones have responded to the current step (shown on the big screen).
    let responses = 0;
    if (state.status === "running" && state.current >= 0) {
      const c = state.program[state.current];
      if (c?.type === "quiz")
        responses = acts.filter((a) => a.kind === "answer" && a.contest_index === state.current && a.question_index === state.qIndex).length;
      else responses = new Set(acts.filter((a) => a.kind === "vote" && a.contest_index === state.current).map((a) => a.player_id)).size;
    }

    // Room signals: live pulse, safety reports, and after-party ratings that release the host payout.
    const pulses = acts.filter((a) => a.kind === "pulse").map((a) => a.value);
    const partyRatings = acts.filter((a) => a.kind === "rate" && a.target_pair === "party").map((a) => a.value);
    const hostRatings = acts.filter((a) => a.kind === "rate" && a.target_pair === "host").map((a) => a.value);
    const room = {
      vibe: avg(pulses),
      vibeCount: pulses.length,
      reports: acts.filter((a) => a.kind === "report").length,
      partyRating: avg(partyRatings),
      hostRating: avg(hostRatings),
      ratingCount: hostRatings.length,
    };

    // Per-player view for the phone.
    let me = null;
    if (playerId) {
      const pair = state.pairs.find((p) => p.a.id === playerId || p.b.id === playerId) ?? null;
      const all = acts.filter((a) => a.player_id === playerId);
      const mine = all.filter((a) => a.contest_index === state.current);
      const again = all.filter((a) => a.kind === "again").map((a) => a.target_pair);
      const people = state.pairs.flatMap((p) => [p.a, p.b]);
      // A match needs both sides. Simulated members answer with a fixed coin-flip.
      const matches = again
        .map((id) => people.find((x) => x.id === id))
        .filter((x): x is NonNullable<typeof x> => !!x)
        .filter((x) =>
          x.demo
            ? hash(`again:${x.id}:${playerId}`) < 0.6
            : acts.some((a) => a.kind === "again" && a.player_id === x.id && a.target_pair === playerId),
        )
        .map((x) => ({ id: x.id, name: x.name, demo: x.demo }));
      me = {
        pairId: pair?.id ?? null,
        answered: mine.find((a) => a.kind === "answer" && a.question_index === state.qIndex)?.value ?? null,
        votes: Object.fromEntries(mine.filter((a) => a.kind === "vote").map((a) => [a.target_pair, a.value])),
        pulse: all.find((a) => a.kind === "pulse")?.value ?? null,
        reported: all.some((a) => a.kind === "report"),
        rates: Object.fromEntries(all.filter((a) => a.kind === "rate").map((a) => [a.target_pair, a.value])),
        again,
        matches,
      };
    }

    // Quiz answers stay hidden until the host reveals them.
    const program = state.program.map((c, ci) => ({
      ...c,
      questions: c.questions?.map((q, qi) => {
        const revealed = state.status === "finished" || ci < state.current || (ci === state.current && (qi < state.qIndex || (qi === state.qIndex && state.phase === "reveal")));
        return { q: q.q, options: q.options, answer: revealed ? q.answer : null };
      }),
    }));

    return NextResponse.json({ state: { ...state, program }, players: players ?? [], scores, responses, room, me });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
