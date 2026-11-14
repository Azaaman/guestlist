import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emptyState, loadState, saveState, setupParty } from "@/lib/live";

export const maxDuration = 60;

// Host controls for the big screen. Optional PIN via LIVE_HOST_PIN.
export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  try {
    const { sid } = await params;
    const { action, pin, partyId } = (await req.json()) as { action: string; pin?: string; partyId?: string };
    if (process.env.LIVE_HOST_PIN && pin !== process.env.LIVE_HOST_PIN)
      return NextResponse.json({ error: "Wrong host PIN" }, { status: 401 });

    if (action === "reset") {
      await db().from("live_actions").delete().eq("session_id", sid);
      await db().from("live_players").delete().eq("session_id", sid);
      await saveState(sid, emptyState());
      return NextResponse.json({ ok: true });
    }
    if (action === "setup") {
      const s = await setupParty(sid, partyId ?? sid);
      return NextResponse.json({ ok: true, pairs: s.pairs.length });
    }

    const s = await loadState(sid);
    if (s.status !== "running") return NextResponse.json({ error: "Party is not running" }, { status: 409 });
    const c = s.program[s.current];

    if (action === "reveal") {
      s.phase = "reveal";
    } else if (action === "next") {
      if (c?.type === "quiz" && c.questions && s.qIndex < c.questions.length - 1) {
        if (s.phase === "open") s.phase = "reveal";
        else {
          s.qIndex += 1;
          s.phase = "open";
        }
      } else if (s.phase === "open") {
        s.phase = "reveal";
      } else if (s.current < s.program.length - 1) {
        s.current += 1;
        s.qIndex = 0;
        s.phase = "open";
      } else {
        s.status = "finished";
      }
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    await saveState(sid, s);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
