import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decideCase, loadCases } from "@/lib/live";
import { PROFILE, type ApplicationRow } from "@/lib/types";

export const dynamic = "force-dynamic";

// The moderator's desk: new profiles that passed AI screening, and conduct cases from parties.
// Open in this demo so the whole flow can be tried; in production it sits behind staff login.
export async function GET() {
  const { data, error } = await db().from("applications").select("*").eq("party_id", PROFILE).in("status", ["pending", "profile"]).order("created_at", { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as ApplicationRow[];
  const cases = (await loadCases()).slice(0, 30);
  return NextResponse.json({ queue: rows.map((r) => ({ id: r.id, form: r.form, card: r.profile, trust: r.trust, created_at: r.created_at })), cases });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { id?: string; action?: "approve" | "reject"; caseId?: string; decision?: "ban" | "clear" };
  if (body.caseId) {
    if (body.decision !== "ban" && body.decision !== "clear") return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
    const c = await decideCase(body.caseId, body.decision);
    if (!c) return NextResponse.json({ error: "This case is already closed." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  if (body.action !== "approve" && body.action !== "reject") return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const { data, error } = await db().from("applications").update({ status: body.action === "approve" ? "verified" : "rejected" }).eq("id", body.id ?? "").eq("party_id", PROFILE).in("status", ["pending", "profile"]).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This profile is no longer waiting for review." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
