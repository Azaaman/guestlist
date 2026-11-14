"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { fetchProfile, type SavedProfile } from "@/lib/profile";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;
const appearance = { theme: "night" as const, variables: { colorPrimary: "#8f7dff", colorBackground: "#0f0a3d", colorText: "#ffffff", colorTextPlaceholder: "#cfc7ff", borderRadius: "10px" } };

export default function PassCheckout({ price, season, weeks }: { price: number; season: string; weeks: number }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState<SavedProfile | null | undefined>(undefined);

  useEffect(() => {
    fetchProfile().then((p) => {
      setProfile(p);
      if (p?.pass) setPaid(true);
    });
  }, []);

  // The pass is attached to the saved profile once Stripe confirms the payment.
  async function attach(paymentIntentId: string) {
    const res = await fetch("/api/pass/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: profile?.id, paymentIntentId }) });
    if (!res.ok) setErr((await res.json()).error || "Paid, but the pass could not be attached to your profile. Reload the page.");
    else setPaid(true);
  }

  async function start() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/pass", { method: "POST" });
      const d = await res.json();
      if (!res.ok) setErr(d.error || "The payment could not be started. Try again.");
      else setSecret(d.clientSecret);
    } catch {
      setErr("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (paid)
    return (
      <div className="paper pop self-start p-6">
        <div className="font-semibold text-[#1f8a5b]">{profile?.form.name ? `${profile.form.name}, you hold a Season Pass.` : "Paid. Welcome to the season."}</div>
        <div className="display mt-1 text-5xl">Season Pass</div>
        <div className="mt-1 font-semibold">{season}</div>
        <p className="rule mt-4 pt-4">You have a seat at all {weeks} parties with nothing more to pay, and you are entered in the prize draw for the three trips. Pick your first night.</p>
        <Link href="/parties" className="btn btn-paper mt-5">Choose a party</Link>
      </div>
    );

  return (
    <div className="card self-start p-6">
      <div className="flex items-baseline justify-between">
        <div className="display text-2xl">{season}</div>
        <div className="display price text-4xl">${price.toLocaleString()}</div>
      </div>
      <p className="mt-1 text-sm text-white/60">{weeks} parties, one payment.</p>
      {!stripePromise ? (
        <p className="mt-4">Payments are not configured: the Stripe publishable key is missing.</p>
      ) : profile === undefined ? (
        <p className="mt-5 text-white/60">Loading…</p>
      ) : profile === null ? (
        <>
          <p className="mt-4 text-white/80">Create your profile first. The pass is attached to it, so you never enter your details again.</p>
          <Link href="/profile?next=/pass" className="btn btn-primary mt-4 w-full">Create my profile</Link>
        </>
      ) : !secret ? (
        <>
          {err && <div className="mt-3 text-sm text-hot">{err}</div>}
          <button className="btn btn-primary mt-5 w-full" onClick={start} disabled={busy}>{busy ? "Preparing…" : `Get the Season Pass for ${profile.form.name.split(" ")[0]}`}</button>
        </>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance }}>
          <PayForm price={price} onPaid={attach} />
        </Elements>
      )}
      <p className="mt-3 text-sm text-white/50">Test mode. Use card 4242 4242 4242 4242, any future date, any CVC.</p>
    </div>
  );
}

function PayForm({ price, onPaid }: { price: number; onPaid: (paymentIntentId: string) => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr("");
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error || paymentIntent?.status !== "succeeded") {
      setErr(error?.message || "The payment did not go through. Try again.");
      setBusy(false);
      return;
    }
    await onPaid(paymentIntent.id);
    setBusy(false);
  }
  return (
    <form onSubmit={pay} className="mt-5 space-y-3">
      <PaymentElement />
      {err && <div className="text-sm text-hot">{err}</div>}
      <button className="btn btn-primary w-full" disabled={busy || !stripe}>{busy ? "Paying…" : `Pay $${price.toLocaleString()}`}</button>
    </form>
  );
}
