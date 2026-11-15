import { NextResponse } from "next/server";
import { generateJson } from "@/lib/ai";
import { db } from "@/lib/db";
import { isBanned } from "@/lib/live";
import { MIN_TRUST, PROFILE, profileStatus, type AIProfile, type ApplicationForm, type ApplicationRow, type Trust } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM = `You are the first screening step at Nestly, an invite-only house-party club in Miami for adults 25-45.
There are no games: the club brings screened people together at private houses. You alone decide whether a new
profile is verified; human moderators only deal with reports from parties. You (1) write a short, honest profile card,
(2) list red flags, (3) give a trust score, (4) say in one line why. Red flags are: disrespect, aggression, sexual
pressure, rule-breaking, anything unsafe. Low effort alone is not a red flag but lowers the score: an empty or
one-line profile scores under ${MIN_TRUST}. Never invent facts. Write in English.`;

function validate(f: ApplicationForm): string | null {
  if (!f?.name?.trim() || !f.about?.trim() || !f.lookingFor?.trim()) return "Fill in your name, what you're looking for and a few words about you.";
  if (!(f.age >= 25 && f.age <= 45)) return "Nestly is for adults 25 to 45.";
  if (f.gender !== "man" && f.gender !== "woman") return "Choose man or woman.";
  if (!f.conduct) return "Accept the house rules to continue.";
  return null;
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data } = await db().from("applications").select("*").eq("id", id).eq("party_id", PROFILE).maybeSingle();
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const row = data as ApplicationRow;
  return NextResponse.json({ id: row.id, form: row.form, pass: !!row.form.pass || row.status === "pass", status: profileStatus(row.status, row.trust), card: row.profile, trust: row.trust });
}

// Create or edit a profile. Every save is screened by AI, and AI alone verifies or rejects it.
export async function POST(req: Request) {
  try {
    const { id, form } = (await req.json()) as { id?: string; form: ApplicationForm };
    const problem = validate(form);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    if (await isBanned(form.name)) return NextResponse.json({ error: "This guest is permanently banned from Nestly." }, { status: 403 });

    let existing: ApplicationRow | null = null;
    if (id) {
      const { data } = await db().from("applications").select("*").eq("id", id).eq("party_id", PROFILE).maybeSingle();
      existing = (data as ApplicationRow | null) ?? null;
      if (existing?.status === "banned") return NextResponse.json({ error: "This profile is permanently banned." }, { status: 403 });
    }

    const clean: ApplicationForm = {
      name: form.name.trim().slice(0, 60), age: Number(form.age), gender: form.gender, into: form.into,
      lookingFor: form.lookingFor.trim().slice(0, 200), about: form.about.trim().slice(0, 600),
      instagram: form.instagram?.trim().slice(0, 60) || "", inviteCode: form.inviteCode?.trim().slice(0, 40) || "", conduct: true,
      pass: !!existing?.form.pass || existing?.status === "pass", // never taken from the client
    };

    const ai = await generateJson<{ profile: AIProfile; redFlags?: string[]; trustScore?: number; moderatorNote?: string }>(
      SYSTEM,
      `NEW PROFILE:
- Name: ${clean.name}
- Age: ${clean.age}, ${clean.gender}
- Into: ${clean.into}
- Looking for: ${clean.lookingFor}
- About: ${clean.about}
- Instagram provided: ${clean.instagram ? "yes" : "no"}
- Invited by a member: ${clean.inviteCode ? "yes" : "no"}

Return JSON exactly in this shape:
{
  "profile": { "headline": "max 8 words", "bio": "2 sentences, third person", "strengths": ["3 short things that make them good company"], "vibe": "2-4 words", "icebreaker": "one question others could ask them" },
  "redFlags": ["empty array if none"],
  "trustScore": 0-100 integer,
  "moderatorNote": "one sentence explaining the score to the guest"
}`,
    );

    const redFlags = Array.isArray(ai.redFlags) ? ai.redFlags.filter(Boolean) : [];
    let score = Math.max(0, Math.min(100, Math.round(Number(ai.trustScore) || 50)));
    if (clean.inviteCode) score = Math.min(100, score + 10);
    if (clean.instagram) score = Math.min(100, score + 5);
    if (redFlags.length) score = Math.min(score, 30);
    const trust: Trust = {
      score,
      redFlags,
      badges: [
        { label: "AI screening", ok: redFlags.length === 0 },
        { label: "Invited by a member", ok: !!clean.inviteCode },
        { label: "Social profile linked", ok: !!clean.instagram },
        { label: "Government ID", ok: false, note: "not part of this MVP" },
        { label: "House rules accepted", ok: true },
      ],
    };
    const status = redFlags.length || score < MIN_TRUST ? "rejected" : "verified";
    const card = { ...ai.profile, moderatorNote: ai.moderatorNote };

    if (existing) {
      const { error } = await db().from("applications").update({ form: clean, profile: card, trust, status }).eq("id", existing.id);
      if (error) throw error;
      return NextResponse.json({ id: existing.id, status });
    }
    const { data, error } = await db().from("applications").insert({ party_id: PROFILE, form: clean, profile: card, trust, status }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "The profile could not be saved." }, { status: 500 });
  }
}
