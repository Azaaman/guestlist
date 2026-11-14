import { NextResponse } from "next/server";
import { generateJson } from "@/lib/ai";
import { db } from "@/lib/db";
import { getParty, MEMBERS } from "@/lib/data";
import type { AIProfile, ApplicationForm, Trust, Vote } from "@/lib/types";

export const maxDuration = 60;

const SYSTEM = `You are the screening engine of Nestly, an invite-only party club in Austin for adults 25-45.
Guests apply to a specific party. Existing members of the opposite gender vote on each application.
You (1) turn the application into a short, flattering-but-honest profile card and
(2) role-play each voting member, deciding YES or NO strictly from their personality and the application.
Be realistic: generic or low-effort applications get mixed votes; anything disrespectful, aggressive,
sexual, or unsafe gets NO from everyone and must be listed in redFlags. Never invent facts about the applicant.
Write in English.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { partyId: string; form: ApplicationForm };
    const party = getParty(body.partyId);
    const f = body.form;
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    if (!f?.name?.trim() || !f.about?.trim() || !f.lookingFor?.trim())
      return NextResponse.json({ error: "Please fill in name, about you and what you're looking for." }, { status: 400 });
    if (!(f.age >= 25 && f.age <= 45))
      return NextResponse.json({ error: "Nestly is for adults 25–45." }, { status: 400 });
    if (!f.conduct) return NextResponse.json({ error: "Please accept the code of conduct." }, { status: 400 });
    if (f.gender !== "man" && f.gender !== "woman")
      return NextResponse.json({ error: "Please choose a gender." }, { status: 400 });

    const voters = MEMBERS.filter((m) => m.gender !== f.gender).slice(0, 5);

    const prompt = `PARTY: "${party.title}" — ${party.theme}. Contests: ${party.contests.join(", ")}.

APPLICATION:
- Name: ${f.name}
- Age: ${f.age}, ${f.gender}
- Best contest skill: ${f.skill}
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
    "strengths": ["3 short strengths useful in couple contests"],
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
        { label: "Card holder name matches", ok: true, note: "checked at payment" },
        { label: "Invited by a member", ok: !!f.inviteCode },
        { label: "Social profile linked", ok: !!f.instagram },
        { label: "Government ID", ok: false, note: "Stripe Identity — before first party" },
        { label: "Code of conduct accepted", ok: true },
      ],
    };

    const { data, error } = await db()
      .from("applications")
      .insert({ party_id: party.id, form: f, profile: ai.profile, votes, trust, status: "reviewed" })
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
