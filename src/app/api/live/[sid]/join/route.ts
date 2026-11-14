import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ApplicationRow } from "@/lib/types";

// Two ways in: a ticket (approved application, checked in at the door) or a walk-up name for the demo.
export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const body = (await req.json()) as { name?: string; gender?: string; skill?: string; ticket?: string };
  let name = (body.name ?? "").trim().slice(0, 24);
  let gender = body.gender;
  let skill = body.skill ?? null;
  let checkedIn = false;

  if (body.ticket) {
    const { data } = await db().from("applications").select("*").eq("id", body.ticket).maybeSingle();
    const app = data as ApplicationRow | null;
    if (!app || app.party_id !== sid) return NextResponse.json({ error: "This ticket is for a different party" }, { status: 400 });
    if (app.status !== "approved") return NextResponse.json({ error: "This ticket is not approved yet" }, { status: 403 });
    name = app.form.name.trim().split(/\s+/)[0].slice(0, 24);
    gender = app.form.gender;
    skill = app.form.skill;
    checkedIn = true;
  }

  if (!name) return NextResponse.json({ error: "Enter your first name" }, { status: 400 });
  if (gender !== "man" && gender !== "woman") return NextResponse.json({ error: "Choose man or woman" }, { status: 400 });
  const { data, error } = await db()
    .from("live_players")
    .insert({ session_id: sid, name, gender, skill })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, name, checkedIn });
}
