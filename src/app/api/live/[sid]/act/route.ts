// Actions from a guest's phone at a party: room pulse, "we met", reports, ratings, "see again".
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getHost, getParty } from "@/lib/data";
import { loadState, removePerson, reportHost } from "@/lib/live";
import { REPORT_REASONS, REPORTS_TO_BAN } from "@/lib/room";

type Kind = "pulse" | "met" | "report" | "rate" | "again";
// Each kind gets its own slot in the (session, player, contest_index, …) unique key.
const SLOT: Record<Kind, number> = { rate: -1, again: -1, pulse: -2, report: -3, met: -4 };

// Everything a guest's phone can send during and after the party.
export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const body = (await req.json()) as { playerId: string; kind: Kind; value: number; target?: string };
  if (!body.playerId) return NextResponse.json({ error: "Check in first" }, { status: 400 });
  if (!(body.kind in SLOT)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const state = await loadState(sid);
  if (state.banned.includes(body.playerId))
    return NextResponse.json({ error: "You have been removed from this party" }, { status: 403 });
  if (state.status === "lobby")
    return NextResponse.json({ error: "The party hasn't started" }, { status: 409 });

  const person = (id?: string) => state.people.find((p) => p.id === id && !state.banned.includes(p.id));
  const value = Math.round(Number(body.value));
  const aboutHost = body.kind === "report" && body.target === "host";
  let target = "-";

  if (body.kind === "pulse") {
    if (!(value >= 1 && value <= 5)) return NextResponse.json({ error: "Rate from 1 to 5" }, { status: 400 });
  } else if (body.kind === "rate") {
    if (state.status !== "finished")
      return NextResponse.json({ error: "Ratings open when the party ends" }, { status: 409 });
    if (body.target !== "party" && body.target !== "host")
      return NextResponse.json({ error: "Unknown rating" }, { status: 400 });
    if (!(value >= 1 && value <= 5)) return NextResponse.json({ error: "Rate from 1 to 5" }, { status: 400 });
    target = body.target;
  } else {
    // met, report, again: all point at another person in the room (a report may also be about the host)
    if (!aboutHost && (!person(body.target) || body.target === body.playerId))
      return NextResponse.json({ error: "That guest is not in the room" }, { status: 400 });
    if (body.kind === "again" && state.status !== "finished")
      return NextResponse.json({ error: "Opens when the party ends" }, { status: 409 });
    if (body.kind === "report" && !(value >= 0 && value < REPORT_REASONS.length))
      return NextResponse.json({ error: "Choose a reason" }, { status: 400 });
    target = body.target!;
  }

  const { error } = await db()
    .from("live_actions")
    .insert({
      session_id: sid,
      player_id: body.playerId,
      contest_index: SLOT[body.kind],
      question_index: 0,
      kind: body.kind,
      target_pair: target,
      value: body.kind === "met" || body.kind === "again" ? 1 : value,
    });
  if (error && error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  const first = !error;

  if (body.kind === "report" && first) {
    if (aboutHost) {
      // The host never sees a report about themselves. It becomes a case for Nestly's moderators.
      const party = getParty(sid);
      await reportHost(sid, (party && getHost(party.hostId)?.name) || "The host", REPORT_REASONS[value]);
      return NextResponse.json({ ok: true, toNestly: true });
    }
    // Enough separate reports take the guest out of the party without waiting for the host.
    const { data } = await db()
      .from("live_actions")
      .select("player_id,value")
      .eq("session_id", sid)
      .eq("kind", "report")
      .eq("target_pair", target);
    const rows = data ?? [];
    const reporters = new Set(rows.map((r) => r.player_id)).size;
    if (reporters >= REPORTS_TO_BAN) {
      await removePerson(
        sid,
        state,
        target,
        "reports",
        [...new Set(rows.map((r) => REPORT_REASONS[r.value] ?? REPORT_REASONS[3]))],
        reporters,
      );
      return NextResponse.json({ ok: true, removed: true });
    }
  }
  return NextResponse.json({ ok: true });
}
