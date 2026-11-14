import Stripe from "stripe";

let s: Stripe | null = null;
export function stripe(): Stripe {
  if (s) return s;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  s = new Stripe(key);
  return s;
}
