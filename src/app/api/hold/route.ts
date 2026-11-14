import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// Marks the application as "held" once Stripe confirms the card hold.
export async function POST(req: Request) {
  try {
    const { applicationId } = (await req.json()) as { applicationId: string };
    const { data: app } = await db().from("applications").select("*").eq("id", applicationId).single();
    if (!app?.payment_intent_id) return NextResponse.json({ error: "No payment" }, { status: 400 });
    const pi = await stripe().paymentIntents.retrieve(app.payment_intent_id);
    if (pi.status !== "requires_capture")
      return NextResponse.json({ error: `Hold not confirmed (status: ${pi.status})` }, { status: 400 });
    if (app.status === "reviewed") await db().from("applications").update({ status: "held" }).eq("id", applicationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
