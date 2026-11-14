import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { APPROVALS_NEEDED, type ApplicationRow } from "@/lib/types";

// Called after the card hold succeeds. Counts member votes:
// approved → capture the payment; rejected → cancel the hold (guest pays nothing).
export async function POST(req: Request) {
  try {
    const { applicationId } = (await req.json()) as { applicationId: string };
    const { data, error } = await db().from("applications").select("*").eq("id", applicationId).single();
    if (error || !data) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const app = data as ApplicationRow;
    if (app.status === "approved" || app.status === "rejected") return NextResponse.json({ status: app.status });
    if (!app.payment_intent_id) return NextResponse.json({ error: "No payment hold yet" }, { status: 400 });

    const pi = await stripe().paymentIntents.retrieve(app.payment_intent_id);
    if (pi.status !== "requires_capture")
      return NextResponse.json({ error: `Payment is not on hold (status: ${pi.status})` }, { status: 400 });

    const yes = (app.votes ?? []).filter((v) => v.vote === "yes").length;
    const flagged = (app.trust?.redFlags ?? []).length > 0;
    const approved = yes >= APPROVALS_NEEDED && !flagged;

    if (approved) await stripe().paymentIntents.capture(pi.id);
    else await stripe().paymentIntents.cancel(pi.id);

    const status = approved ? "approved" : "rejected";
    await db().from("applications").update({ status }).eq("id", applicationId);
    return NextResponse.json({ status, yes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Decision failed" }, { status: 500 });
  }
}
