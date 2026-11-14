"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import QRCode from "qrcode";

interface Booking {
  id: string;
  party_id: string;
  status: "reviewed" | "approved" | "waitlist";
  form: { name: string; pass: boolean };
  meta: { position?: number; reason?: string } | null;
  reveal: { address: string; dressCode: string } | null;
}

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;
const appearance = { theme: "night" as const, variables: { colorPrimary: "#8f7dff", colorBackground: "#0f0a3d", colorText: "#ffffff", colorTextPlaceholder: "#cfc7ff", borderRadius: "10px" } };

export default function ApplicationFlow({ id, partyTitle, partyId, partyWhen, price, live }: { id: string; partyTitle: string; partyId: string; partyWhen: string; price: number; live: boolean }) {
  const [b, setB] = useState<Booking | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/application/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "This booking could not be loaded.");
      else setB(data);
    } catch {
      setErr("No connection. Reload the page to try again.");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (err) return <div className="mt-8 rounded-xl bg-hot/15 p-4">{err}</div>;
  if (!b) return <div className="mt-8 text-white/60">Loading your booking…</div>;

  return (
    <div className="mt-6 space-y-6">
      {b.status === "approved" && <Ticket b={b} partyTitle={partyTitle} partyId={partyId} partyWhen={partyWhen} live={live} />}
      {b.status === "reviewed" && <PayStep id={id} price={price} onPaid={load} />}
      {b.status === "waitlist" && <Waitlist b={b} />}
    </div>
  );
}

function PayStep({ id, price, onPaid }: { id: string; price: number; onPaid: () => void }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: id }) });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "The payment could not be started. Try again.");
      else setSecret(data.clientSecret);
    } catch {
      setErr("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!stripePromise) return <div className="card p-4">Payments are not configured: the Stripe publishable key is missing.</div>;

  return (
    <div className="card p-5">
      <h2 className="text-2xl">A place is free. Pay <span className="price">${price}</span> to book it</h2>
      <p className="mt-2 text-white/75">The address unlocks as soon as the payment goes through. The price rises as the party fills up.</p>
      {!secret ? (
        <>
          {err && <div className="mt-3 text-sm text-hot">{err}</div>}
          <button className="btn btn-primary mt-4 w-full" onClick={start} disabled={busy}>{busy ? "Preparing…" : `Pay $${price}`}</button>
        </>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance }}>
          <CardForm id={id} price={price} onPaid={onPaid} />
        </Elements>
      )}
      <p className="mt-3 text-sm text-white/55">Test mode. Use card 4242 4242 4242 4242, any future date, any CVC.</p>
      <p className="mt-2 text-sm text-white/55">With a <Link href="/pass" className="font-semibold text-brand-2 hover:underline">Season Pass</Link> every party is already paid for.</p>
    </div>
  );
}

function CardForm({ id, price, onPaid }: { id: string; price: number; onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr("");
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) {
      setErr(error.message || "The card was not accepted. Check the details and try again.");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: id }) });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "The payment was not confirmed. Try again.");
      setBusy(false);
      return;
    }
    onPaid();
  }

  return (
    <form onSubmit={pay} className="mt-4 space-y-3">
      <PaymentElement />
      {err && <div className="text-sm text-hot">{err}</div>}
      <button className="btn btn-primary w-full" disabled={busy || !stripe}>{busy ? "Paying…" : `Pay $${price}`}</button>
    </form>
  );
}

function Waitlist({ b }: { b: Booking }) {
  return (
    <div className="card p-5">
      <h2 className="text-2xl">You are on the waitlist</h2>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="display price text-6xl">{b.meta?.position ?? 1}</span>
        <span className="text-lg text-white/85">your place in the queue</span>
      </div>
      <p className="mt-3 text-white/80">{b.meta?.reason}</p>
      <p className="mt-2 text-white/75">Nothing has been charged. When a place opens for you, you get it automatically{b.form.pass ? "." : " and are asked to pay."}</p>
      {b.form.pass ? (
        <p className="mt-4 rounded-xl border border-line p-3 text-sm">Your Season Pass puts you ahead of everyone without one.</p>
      ) : (
        <p className="mt-4 rounded-xl border border-line p-3 text-sm">Season Pass holders go to the front of every waitlist. <Link href="/pass" className="font-semibold text-brand-2 hover:underline">Get a Season Pass</Link></p>
      )}
      <Link href="/parties" className="btn btn-ghost mt-4 w-full sm:w-auto">Look at other parties</Link>
    </div>
  );
}

function Ticket({ b, partyTitle, partyId, partyWhen, live }: { b: Booking; partyTitle: string; partyId: string; partyWhen: string; live: boolean }) {
  const [qr, setQr] = useState("");
  const path = `/play/${partyId}?ticket=${b.id}`;
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}${path}`, { margin: 0, width: 240, color: { dark: "#17103f", light: "#f2f2f2" } }).then(setQr);
  }, [path]);
  return (
    <div className="paper pop grid sm:grid-cols-[1fr_auto]">
      <div className="p-6">
        <div className="font-semibold text-[#1f8a5b]">Booked. You&apos;re on the list.</div>
        <div className="display mt-1 text-4xl">{partyTitle}</div>
        <div className="mt-1 font-semibold">{partyWhen}</div>
        <dl className="rule mt-4 space-y-3 pt-4">
          <div><dt className="label">Address, now unlocked</dt><dd className="text-lg font-bold">{b.reveal?.address}</dd></div>
          <div><dt className="label">Dress code</dt><dd>{b.reveal?.dressCode}</dd></div>
          <div><dt className="label">Admit one</dt><dd>{b.form.name}. {b.form.pass ? "Covered by your Season Pass." : "Ticket paid."}</dd></div>
        </dl>
        {live && <Link href={path} className="btn btn-paper mt-5 w-full sm:w-auto">Check in at the party</Link>}
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-paper-ink/30 p-6 sm:border-l sm:border-t-0">
        {qr && <img src={qr} alt="Check-in QR code" className="h-40 w-40" />}
        <div className="text-center text-sm text-paper-ink/70">Scan at the door<br />to check in</div>
      </div>
    </div>
  );
}
