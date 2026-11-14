import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PROFILE, type ApplicationRow } from "@/lib/types";

export const dynamic = "force-dynamic";

// The moderator's queue: profiles that passed AI screening and wait for a human decision.
// Open in this demo so the whole flow can be tried; in production it sits behind staff login.
export async function GET() {
  const { data, error } = await db().from("applications").select("*").eq("party_id", PROFILE).in("status", ["pending", "profile"]).order("created_at", { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as ApplicationRow[];
  return NextResponse.json({ queue: rows.map((r) => ({ id: r.id, form: r.form, card: r.profile, trust: r.trust, created_at: r.created_at })) });
}

export async function POST(req: Request) {
  const { id, action } = (await req.json()) as { id: string; action: "approve" | "reject" };
  if (action !== "approve" && action !== "reject") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const { data, error } = await db().from("applications").update({ status: action === "approve" ? "verified" : "rejected" }).eq("id", id).eq("party_id", PROFILE).in("status", ["pending", "profile"]).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This profile is no longer waiting for review." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
