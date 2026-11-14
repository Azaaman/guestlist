import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getParty } from "@/lib/data";
import { CANCEL_HOURS } from "@/lib/room";

// Cancel a booking. Free until 24 hours before the party; after that the ticket is still charged.
export async function POST(req: Request) {
  try {
    const { applicationId } = (await req.json()) as { applicationId: string };
    const { data: app } = await db().from("applications").select("*").eq("id", applicationId).single();
    if (!app || !["approved", "reviewed", "waitlist"].includes(app.status)) return NextResponse.json({ error: "This booking can't be cancelled." }, { status: 409 });
    const party = getParty(app.party_id);
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    const hoursLeft = (new Date(party.date).getTime() - Date.now()) / 3600000;
    if (app.status === "approved" && hoursLeft < CANCEL_HOURS)
      return NextResponse.json({ error: `Less than ${CANCEL_HOURS} hours to go: the ticket can no longer be refunded.` }, { status: 409 });
    if (app.payment_intent_id) {
      const pi = await stripe().paymentIntents.retrieve(app.payment_intent_id);
      if (["requires_capture", "requires_payment_method", "requires_confirmation"].includes(pi.status)) await stripe().paymentIntents.cancel(pi.id);
    }
    await db().from("applications").update({ status: "cancelled" }).eq("id", applicationId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The booking could not be cancelled." }, { status: 500 });
  }
}
