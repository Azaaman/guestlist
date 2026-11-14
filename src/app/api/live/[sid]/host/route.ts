import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { banPerson, emptyState, loadState, openRoom, saveState } from "@/lib/live";

export const maxDuration = 60;

// Host controls for the big screen. Optional PIN via LIVE_HOST_PIN.
export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  try {
    const { sid } = await params;
    const { action, pin, partyId, target } = (await req.json()) as { action: string; pin?: string; partyId?: string; target?: string };
    if (process.env.LIVE_HOST_PIN && pin !== process.env.LIVE_HOST_PIN)
      return NextResponse.json({ error: "Wrong host PIN" }, { status: 401 });

    if (action === "reset") {
      await db().from("live_actions").delete().eq("session_id", sid);
      await db().from("live_players").delete().eq("session_id", sid);
      await saveState(sid, emptyState());
      // Demo convenience: a full reset also clears the permanent-ban list so the walkthrough can be repeated.
      await db().from("live_sessions").delete().eq("id", "bans");
      return NextResponse.json({ ok: true });
    }
    // "open" starts the party; pressing it again re-matches the room to include late arrivals.
    if (action === "open") {
      const s = await openRoom(sid, partyId ?? sid);
      return NextResponse.json({ ok: true, people: s.people.length });
    }

    const s = await loadState(sid);
    if (action === "end") {
      if (s.status !== "running") return NextResponse.json({ error: "The party is not running" }, { status: 409 });
      s.status = "finished";
      await saveState(sid, s);
      return NextResponse.json({ ok: true });
    }
    if (action === "confirm" || action === "dismiss") {
      if (!target || !s.people.some((p) => p.id === target)) return NextResponse.json({ error: "Unknown guest" }, { status: 400 });
      const { data } = await db().from("live_actions").select("player_id").eq("session_id", sid).eq("kind", "report").eq("target_pair", target);
      if (!data?.length) return NextResponse.json({ error: "There is no report about this guest" }, { status: 400 });
      if (action === "confirm") await banPerson(sid, s, target, "Report confirmed by the host");
      else {
        s.dismissed.push(target);
        await saveState(sid, s);
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
