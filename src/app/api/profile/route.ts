import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ApplicationForm } from "@/lib/types";

// A profile is stored as a row in `applications` with party_id "profile":
// status "profile" for a regular guest, "pass" once they hold a Season Pass.
const PROFILE = "profile";

function validate(f: ApplicationForm): string | null {
  if (!f?.name?.trim() || !f.about?.trim() || !f.lookingFor?.trim()) return "Fill in your name, what you're looking for and a few words about you.";
  if (!(f.age >= 25 && f.age <= 45)) return "Nestly is for adults 25 to 45.";
  if (f.gender !== "man" && f.gender !== "woman") return "Choose man or woman.";
  if (!f.conduct) return "Accept the code of conduct to continue.";
  return null;
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data } = await db().from("applications").select("id,form,status").eq("id", id).eq("party_id", PROFILE).maybeSingle();
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json({ id: data.id, form: data.form, pass: data.status === "pass" });
}

// Create a profile, or update it when an id is sent.
export async function POST(req: Request) {
  try {
    const { id, form } = (await req.json()) as { id?: string; form: ApplicationForm };
    const problem = validate(form);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    const clean = {
      name: form.name.trim().slice(0, 60), age: Number(form.age), gender: form.gender, into: form.into,
      lookingFor: form.lookingFor.trim().slice(0, 200), about: form.about.trim().slice(0, 600),
      instagram: form.instagram?.trim().slice(0, 60) || "", inviteCode: form.inviteCode?.trim().slice(0, 40) || "", conduct: true,
    };
    if (id) {
      const { data, error } = await db().from("applications").update({ form: clean }).eq("id", id).eq("party_id", PROFILE).select("id").maybeSingle();
      if (error) throw error;
      if (data) return NextResponse.json({ id: data.id });
    }
    const { data, error } = await db().from("applications").insert({ party_id: PROFILE, form: clean, status: "profile" }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The profile could not be saved." }, { status: 500 });
  }
}
