import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeScores, loadState, type ActionRow } from "@/lib/live";

export const dynamic = "force-dynamic";

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

    // Tallies for the current step (shown on the big screen).
    let responses = 0;
    if (state.status === "running" && state.current >= 0) {
      const c = state.program[state.current];
      if (c?.type === "quiz")
        responses = acts.filter((a) => a.kind === "answer" && a.contest_index === state.current && a.question_index === state.qIndex).length;
      else responses = new Set(acts.filter((a) => a.kind === "vote" && a.contest_index === state.current).map((a) => a.player_id)).size;
    }

    // Per-player info for the phone view.
    let me = null;
    if (playerId) {
      const pair = state.pairs.find((p) => p.a.id === playerId || p.b.id === playerId) ?? null;
      const mine = acts.filter((a) => a.player_id === playerId && a.contest_index === state.current);
      me = {
        pairId: pair?.id ?? null,
        answered: mine.find((a) => a.kind === "answer" && a.question_index === state.qIndex)?.value ?? null,
        votes: Object.fromEntries(mine.filter((a) => a.kind === "vote").map((a) => [a.target_pair, a.value])),
      };
    }

    // Hide quiz answers until reveal.
    const program = state.program.map((c, ci) => ({
      ...c,
      questions: c.questions?.map((q, qi) => {
        const revealed = state.status === "finished" || ci < state.current || (ci === state.current && (qi < state.qIndex || (qi === state.qIndex && state.phase === "reveal")));
        return { q: q.q, options: q.options, answer: revealed ? q.answer : null };
      }),
    }));

    return NextResponse.json({ state: { ...state, program }, players: players ?? [], scores, responses, me });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
