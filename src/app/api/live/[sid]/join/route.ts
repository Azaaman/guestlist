import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBanned, loadState, packAbout, saveState } from "@/lib/live";
import type { ApplicationRow } from "@/lib/types";

// Two ways in: a ticket (approved application, checked in at the door) or a walk-up name for the demo.
export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const body = (await req.json()) as { name?: string; gender?: string; into?: string; ticket?: string; profileId?: string };
  let name = (body.name ?? "").trim().slice(0, 24);
  let gender = body.gender;
  let about: string | null = body.into ? `Into ${body.into.toLowerCase()}.` : null;
  let checkedIn = false;
  let profileId: string | null = null;

  if (body.profileId && !body.ticket) {
    // Checking in with a saved profile: nothing to type again.
    const { data } = await db().from("applications").select("form,status").eq("id", body.profileId).eq("party_id", "profile").maybeSingle();
    const f = (data?.form ?? null) as ApplicationRow["form"] | null;
    if (data?.status === "banned") return NextResponse.json({ error: "This profile is permanently banned from Nestly." }, { status: 403 });
    profileId = body.profileId;
    if (!f) return NextResponse.json({ error: "Profile not found. Enter your name instead." }, { status: 404 });
    name = f.name.trim().split(/\s+/)[0].slice(0, 24);
    gender = f.gender;
    about = `Into ${(f.into ?? "meeting people").toLowerCase()}. ${f.about}`.slice(0, 400);
    checkedIn = true;
  }

  if (body.ticket) {
    const { data } = await db().from("applications").select("*").eq("id", body.ticket).maybeSingle();
    const app = data as ApplicationRow | null;
    if (!app || app.party_id !== sid) return NextResponse.json({ error: "This ticket is for a different party" }, { status: 400 });
    if (app.status !== "approved") return NextResponse.json({ error: "This booking does not have a ticket yet" }, { status: 403 });
    profileId = app.form.profileId ?? null;
    name = app.form.name.trim().split(/\s+/)[0].slice(0, 24);
    gender = app.form.gender;
    about = `Into ${(app.form.into ?? app.form.skill ?? "meeting people").toLowerCase()}. ${app.form.about}`.slice(0, 400);
    checkedIn = true;
  }

  if (!name) return NextResponse.json({ error: "Enter your first name" }, { status: 400 });
  if (gender !== "man" && gender !== "woman") return NextResponse.json({ error: "Choose man or woman" }, { status: 400 });
  if (await isBanned(name)) return NextResponse.json({ error: "This guest is permanently banned from Nestly." }, { status: 403 });
  const { data, error } = await db()
    .from("live_players")
    .insert({ session_id: sid, name, gender, skill: packAbout(about, profileId) })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Someone arriving after the room opened still shows up on the guest wall.
  const state = await loadState(sid);
  if (state.status === "running") {
    state.people.unshift({ id: data.id, name, gender, demo: false, about: about ?? undefined, profileId: profileId ?? undefined });
    await saveState(sid, state);
  }
  return NextResponse.json({ id: data.id, name, checkedIn });
}
