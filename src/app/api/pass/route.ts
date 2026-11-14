import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { SEASON } from "@/lib/data";

// Season Pass: one payment for all twelve parties (Stripe test mode).
export async function POST() {
  try {
    const pi = await stripe().paymentIntents.create({
      amount: SEASON.passPrice * 100,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      description: `Guestlist Season Pass, ${SEASON.name}`,
      metadata: { product: "season_pass" },
    });
    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not start the payment" }, { status: 500 });
  }
}
