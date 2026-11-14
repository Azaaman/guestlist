import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// Once Stripe confirms the ticket payment, the booking becomes a ticket.
export async function POST(req: Request) {
  try {
    const { applicationId } = (await req.json()) as { applicationId: string };
    const { data: app } = await db().from("applications").select("*").eq("id", applicationId).single();
    if (!app?.payment_intent_id) return NextResponse.json({ error: "No payment found for this booking." }, { status: 400 });
    const pi = await stripe().paymentIntents.retrieve(app.payment_intent_id);
    if (pi.status !== "succeeded") return NextResponse.json({ error: `The payment has not gone through (status: ${pi.status}).` }, { status: 400 });
    if (app.status === "reviewed") await db().from("applications").update({ status: "approved" }).eq("id", applicationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The payment could not be confirmed." }, { status: 500 });
  }
}
