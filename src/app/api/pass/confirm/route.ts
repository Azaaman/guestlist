import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// After Stripe confirms the payment, attach the Season Pass to the guest's profile.
export async function POST(req: Request) {
  try {
    const { profileId, paymentIntentId } = (await req.json()) as { profileId: string; paymentIntentId: string };
    const pi = await stripe().paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded" || pi.metadata?.product !== "season_pass")
      return NextResponse.json({ error: "The payment has not gone through." }, { status: 400 });
    const { data: prof } = await db().from("applications").select("form").eq("id", profileId).eq("party_id", "profile").maybeSingle();
    if (!prof) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    const { error } = await db().from("applications").update({ form: { ...prof.form, pass: true }, payment_intent_id: pi.id }).eq("id", profileId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "The pass could not be saved." }, { status: 500 });
  }
}
