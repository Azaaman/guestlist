import { NextResponse } from "next/server";
import { addAppeal } from "@/lib/live";

// A removed guest tells their side before the moderator decides.
export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const { playerId, text } = (await req.json()) as { playerId: string; text: string };
  if (!text?.trim()) return NextResponse.json({ error: "Write a few words first." }, { status: 400 });
  const ok = await addAppeal(sid, playerId, text);
  if (!ok) return NextResponse.json({ error: "There is no open case to appeal." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
