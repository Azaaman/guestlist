import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const { name, gender, skill } = (await req.json()) as { name: string; gender: string; skill?: string };
  const clean = (name ?? "").trim().slice(0, 24);
  if (!clean) return NextResponse.json({ error: "Enter your name" }, { status: 400 });
  if (gender !== "man" && gender !== "woman") return NextResponse.json({ error: "Choose man or woman" }, { status: 400 });
  const { data, error } = await db()
    .from("live_players")
    .insert({ session_id: sid, name: clean, gender, skill: skill ?? null })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
