import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getParty } from "@/lib/data";
import { DEPOSIT } from "@/lib/room";
import type { BookingMeta } from "@/lib/types";

// Places one card hold for a booking: the ticket price plus the refundable damage deposit.
// Nothing is charged yet. After the party the ticket is captured and the deposit released.
export async function POST(req: Request) {
  try {
    const { applicationId } = (await req.json()) as { applicationId: string };
    const { data: app, error } = await db().from("applications").select("*").eq("id", applicationId).single();
    if (error || !app) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (app.status !== "reviewed") return NextResponse.json({ error: "This booking is not waiting for a card." }, { status: 409 });
    const party = getParty(app.party_id);
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    if (app.payment_intent_id) {
      const existing = await stripe().paymentIntents.retrieve(app.payment_intent_id);
      if (existing.status === "requires_payment_method" || existing.status === "requires_confirmation")
        return NextResponse.json({ clientSecret: existing.client_secret });
    }
    const meta = (app.votes ?? {}) as BookingMeta;
    const pi = await stripe().paymentIntents.create({
      amount: ((meta.price ?? 0) + (meta.deposit ?? DEPOSIT)) * 100,
      currency: "usd",
      capture_method: "manual",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: `Nestly booking, ${party.title}`,
      metadata: { applicationId, partyId: party.id, product: "ticket", ticket: String(meta.price ?? 0), deposit: String(meta.deposit ?? DEPOSIT) },
    });
    await db().from("applications").update({ payment_intent_id: pi.id }).eq("id", applicationId);
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "The card step could not be started." }, { status: 500 });
  }
}
