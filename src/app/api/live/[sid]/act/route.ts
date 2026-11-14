import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadState } from "@/lib/live";

type Kind = "answer" | "vote" | "pulse" | "report" | "rate" | "again";

// Everything a phone can send during and after the party.
export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const body = (await req.json()) as { playerId: string; kind: Kind; value: number; targetPair?: string };
  if (!body.playerId) return NextResponse.json({ error: "Join the party first" }, { status: 400 });
  const state = await loadState(sid);
  const c = state.program[state.current];
  const myPair = state.pairs.find((p) => p.a.id === body.playerId || p.b.id === body.playerId);
  const people = state.pairs.flatMap((p) => [p.a, p.b]);

  let contestIndex = state.current;
  let questionIndex = 0;
  let target = "-";
  const value = Math.round(Number(body.value));

  if (body.kind === "answer" || body.kind === "vote") {
    if (state.status !== "running" || state.phase !== "open" || !c)
      return NextResponse.json({ error: "This round is closed" }, { status: 409 });
    if (body.kind === "answer") {
      if (c.type !== "quiz") return NextResponse.json({ error: "This round is not a quiz" }, { status: 400 });
      if (!myPair) return NextResponse.json({ error: "Only paired guests answer. You are a judge tonight." }, { status: 403 });
      questionIndex = state.qIndex;
    } else {
      if (c.type !== "vote") return NextResponse.json({ error: "This round is not judged" }, { status: 400 });
      if (!body.targetPair || !state.pairs.some((p) => p.id === body.targetPair))
        return NextResponse.json({ error: "Unknown couple" }, { status: 400 });
      if (myPair?.id === body.targetPair) return NextResponse.json({ error: "You can't score your own couple" }, { status: 403 });
      if (!(value >= 1 && value <= 5)) return NextResponse.json({ error: "Score from 1 to 5" }, { status: 400 });
      target = body.targetPair;
    }
  } else if (body.kind === "pulse" || body.kind === "report") {
    if (state.status === "lobby") return NextResponse.json({ error: "The party hasn't started" }, { status: 409 });
    if (body.kind === "pulse" && !(value >= 1 && value <= 5)) return NextResponse.json({ error: "Rate from 1 to 5" }, { status: 400 });
    contestIndex = body.kind === "pulse" ? -2 : -3;
  } else if (body.kind === "rate" || body.kind === "again") {
    if (state.status !== "finished") return NextResponse.json({ error: "Ratings open when the party ends" }, { status: 409 });
    contestIndex = -1;
    if (body.kind === "rate") {
      if (body.targetPair !== "party" && body.targetPair !== "host") return NextResponse.json({ error: "Unknown rating" }, { status: 400 });
      if (!(value >= 1 && value <= 5)) return NextResponse.json({ error: "Rate from 1 to 5" }, { status: 400 });
      target = body.targetPair;
    } else {
      if (!people.some((x) => x.id === body.targetPair) || body.targetPair === body.playerId)
        return NextResponse.json({ error: "Unknown guest" }, { status: 400 });
      target = body.targetPair!;
    }
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { error } = await db().from("live_actions").insert({
    session_id: sid,
    player_id: body.playerId,
    contest_index: contestIndex,
    question_index: questionIndex,
    kind: body.kind,
    target_pair: target,
    value: body.kind === "again" || body.kind === "report" ? 1 : value,
  });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
