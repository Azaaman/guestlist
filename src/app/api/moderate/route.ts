import { NextResponse } from "next/server";
import { decideCase, loadCases } from "@/lib/live";

export const dynamic = "force-dynamic";

// The moderator's desk holds conduct cases only: guests removed from a party and reports about hosts.
// New profiles never come here; AI screening verifies them. Open in this demo so the flow can be tried;
// in production it sits behind staff login.
export async function GET() {
  try {
    return NextResponse.json({ cases: (await loadCases()).slice(0, 30) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as { caseId?: string; decision?: "ban" | "clear" };
  if (!body.caseId || (body.decision !== "ban" && body.decision !== "clear")) return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
  const c = await decideCase(body.caseId, body.decision);
  if (!c) return NextResponse.json({ error: "This case is already closed." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
