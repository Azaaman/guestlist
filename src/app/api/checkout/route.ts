import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { dynamicPrice, getParty } from "@/lib/data";

// Creates a PaymentIntent with manual capture: the money is only held.
// It is captured if the guest is approved, released if not.
export async function POST(req: Request) {
  try {
    const { applicationId } = (await req.json()) as { applicationId: string };
    const { data: app, error } = await db().from("applications").select("*").eq("id", applicationId).single();
    if (error || !app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    const party = getParty(app.party_id);
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    if (app.payment_intent_id) {
      const existing = await stripe().paymentIntents.retrieve(app.payment_intent_id);
      if (existing.status === "requires_payment_method" || existing.status === "requires_confirmation")
        return NextResponse.json({ clientSecret: existing.client_secret, amount: existing.amount });
    }

    const amount = dynamicPrice(party) * 100;
    const pi = await stripe().paymentIntents.create({
      amount,
      currency: "usd",
      capture_method: "manual",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: `Guestlist · ${party.title}`,
      metadata: { applicationId, partyId: party.id },
    });
    await db().from("applications").update({ payment_intent_id: pi.id }).eq("id", applicationId);
    return NextResponse.json({ clientSecret: pi.client_secret, amount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 500 });
  }
}
