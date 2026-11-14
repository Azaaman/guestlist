import { NextResponse } from "next/server";
import { generateJson } from "@/lib/ai";
import { db } from "@/lib/db";
import { getParty, MEMBERS } from "@/lib/data";
import { isBanned } from "@/lib/live";
import type { AIProfile, ApplicationForm, Trust, Vote } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM = `You are the screening engine of Nestly, an invite-only party club in Austin for adults 25-45.
There are no games or contests: the club simply brings screened people together.
Guests apply to a specific party. Existing members of the opposite gender vote on each application.
You (1) turn the application into a short, flattering-but-honest profile card and
(2) role-play each voting member, deciding YES or NO strictly from their personality and the application.
Be realistic: generic or low-effort applications get mixed votes; anything disrespectful, aggressive,
sexual, or unsafe gets NO from everyone and must be listed in redFlags. Never invent facts about the applicant.
Write in English.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { partyId: string; profileId: string };
    const party = getParty(body.partyId);
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    const { data: prof } = await db().from("applications").select("form,status").eq("id", body.profileId ?? "").eq("party_id", "profile").maybeSingle();
    if (!prof) return NextResponse.json({ error: "Create your profile first." }, { status: 400 });
    const hasPass = prof.status === "pass";
    const f = prof.form as ApplicationForm;

    if (await isBanned(f.name))
      return NextResponse.json({ error: "This guest was permanently banned after reports at a previous party and cannot apply." }, { status: 403 });

    const voters = MEMBERS.filter((m) => m.gender !== f.gender).slice(0, 5);

    const prompt = `PARTY: "${party.title}" — ${party.theme}. Vibe: ${party.vibes.join(", ")}.

APPLICATION:
- Name: ${f.name}
- Age: ${f.age}, ${f.gender}
- Into: ${f.into ?? f.skill ?? "not said"}
- Looking for: ${f.lookingFor}
- About: ${f.about}
- Instagram provided: ${f.instagram ? "yes" : "no"}
- Invited by a member: ${f.inviteCode ? "yes" : "no"}

VOTING MEMBERS:
${voters.map((v) => `- id=${v.id} ${v.name}, ${v.age}, ${v.job}. Judging style: ${v.personality}`).join("\n")}

Return JSON exactly in this shape:
{
  "profile": {
    "headline": "max 8 words",
    "bio": "2 sentences, third person",
    "strengths": ["3 short things that make them good company at a party"],
    "vibe": "2-4 words",
    "icebreaker": "one fun question other guests could ask them"
  },
  "redFlags": ["empty array if none"],
  "trustScore": 0-100 integer (quality, sincerity and safety of the application),
  "votes": [ { "voterId": "id from list", "vote": "yes" | "no", "reason": "one short sentence in the member's voice" } ]
}
Include exactly one vote for each of the ${voters.length} members.`;

    const ai = await generateJson<{ profile: AIProfile; redFlags?: string[]; trustScore?: number; votes: Vote[] }>(
      SYSTEM,
      prompt,
    );

    const votes: Vote[] = voters.map((v) => {
      const found = ai.votes?.find((x) => x.voterId === v.id) ?? ai.votes?.find((x) => x.voter === v.name);
      return {
        voterId: v.id,
        voter: v.name,
        vote: found?.vote === "no" ? "no" : found ? "yes" : "no",
        reason: found?.reason ?? "Didn't get a clear sense of you yet.",
      };
    });

    const redFlags = Array.isArray(ai.redFlags) ? ai.redFlags.filter(Boolean) : [];
    let score = Math.max(0, Math.min(100, Math.round(Number(ai.trustScore) || 50)));
    if (f.inviteCode) score = Math.min(100, score + 10);
    if (f.instagram) score = Math.min(100, score + 5);
    if (redFlags.length) score = Math.min(score, 30);

    const trust: Trust = {
      score,
      redFlags,
      badges: [
        { label: hasPass ? "Season Pass holder" : "Card holder name matches", ok: true, note: hasPass ? undefined : "checked at payment" },
        { label: "Invited by a member", ok: !!f.inviteCode },
        { label: "Social profile linked", ok: !!f.instagram },
        { label: "Government ID", ok: false, note: "Stripe Identity — before first party" },
        { label: "Code of conduct accepted", ok: true },
      ],
    };

    const { data, error } = await db()
      .from("applications")
      // Pass holders have already paid, so their application goes straight to the members' vote.
      .insert({ party_id: party.id, form: { ...f, pass: hasPass }, profile: ai.profile, votes, trust, status: hasPass ? "held" : "reviewed" })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Could not process the application: ${msg}` }, { status: 500 });
  }
}
