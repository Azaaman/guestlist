import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadState } from "@/lib/live";

export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const body = (await req.json()) as { playerId: string; kind: "answer" | "vote"; value: number; targetPair?: string };
  const state = await loadState(sid);
  if (state.status !== "running" || state.phase !== "open")
    return NextResponse.json({ error: "Not accepting answers right now" }, { status: 409 });
  const c = state.program[state.current];
  if (!c) return NextResponse.json({ error: "No active contest" }, { status: 409 });
  const myPair = state.pairs.find((p) => p.a.id === body.playerId || p.b.id === body.playerId);

  if (body.kind === "answer") {
    if (c.type !== "quiz") return NextResponse.json({ error: "Not a quiz" }, { status: 400 });
    if (!myPair) return NextResponse.json({ error: "Only paired players answer — you're a judge tonight" }, { status: 403 });
  } else {
    if (c.type !== "vote") return NextResponse.json({ error: "Not a voting round" }, { status: 400 });
    if (!body.targetPair || !state.pairs.some((p) => p.id === body.targetPair))
      return NextResponse.json({ error: "Unknown pair" }, { status: 400 });
    if (myPair?.id === body.targetPair) return NextResponse.json({ error: "You can't vote for your own pair" }, { status: 403 });
    if (!(body.value >= 1 && body.value <= 5)) return NextResponse.json({ error: "Vote 1–5" }, { status: 400 });
  }

  const { error } = await db().from("live_actions").insert({
    session_id: sid,
    player_id: body.playerId,
    contest_index: state.current,
    question_index: c.type === "quiz" ? state.qIndex : 0,
    kind: body.kind,
    target_pair: body.kind === "vote" ? body.targetPair : "-",
    value: body.value,
  });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
