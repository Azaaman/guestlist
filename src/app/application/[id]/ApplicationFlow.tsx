"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import QRCode from "qrcode";
import { CANCEL_HOURS, DEPOSIT } from "@/lib/room";

interface Booking {
  id: string;
  party_id: string;
  status: "reviewed" | "approved" | "waitlist" | "cancelled";
  form: { name: string; pass: boolean };
  meta: { position?: number; reason?: string; price?: number; deposit?: number; settled?: string } | null;
  reveal: { address: string; dressCode: string } | null;
  refundable: boolean;
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
      {b.status === "reviewed" && <PayStep id={id} ticket={b.meta?.price ?? price} deposit={b.meta?.deposit ?? DEPOSIT} onPaid={load} />}
      {b.status === "waitlist" && <Waitlist b={b} />}
      {b.status === "cancelled" && (
        <div className="card p-5">
          <h2 className="text-2xl">Booking cancelled</h2>
          <p className="mt-2 text-white/80">The hold on your card was released. Nothing was charged.</p>
          <Link href="/parties" className="btn btn-primary mt-4">Choose another party</Link>
        </div>
      )}
      {(b.status === "approved" || b.status === "reviewed") && <Cancel b={b} onDone={load} />}
    </div>
  );
}

function PayStep({ id, ticket, deposit, onPaid }: { id: string; ticket: number; deposit: number; onPaid: () => void }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const total = ticket + deposit;

  async function start() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: id }) });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "The card step could not be started. Try again.");
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
      <h2 className="text-2xl">A place is free. Hold <span className="price">${total}</span> on your card to book it</h2>
      <dl className="mt-4">
        <div className="flex justify-between border-t border-line py-3"><dt>Ticket{ticket === 0 ? ", covered by your Season Pass" : ""}</dt><dd className="font-semibold">${ticket}</dd></div>
        <div className="flex justify-between border-t border-line py-3"><dt>Damage deposit, released after the party</dt><dd className="font-semibold">${deposit}</dd></div>
      </dl>
      <p className="mt-2 text-sm text-white/70">Nothing is charged now. After the party {ticket > 0 ? "the ticket is charged and " : ""}the deposit is released, unless the host reports damage you caused.</p>
      {!secret ? (
        <>
          {err && <div className="mt-3 text-sm text-hot">{err}</div>}
          <button className="btn btn-primary mt-4 w-full" onClick={start} disabled={busy}>{busy ? "Preparing…" : `Hold $${total} and book`}</button>
        </>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance }}>
          <CardForm id={id} price={total} onPaid={onPaid} />
        </Elements>
      )}
      <p className="mt-3 text-sm text-white/55">Test mode. Use card 4242 4242 4242 4242, any future date, any CVC.</p>
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
      setErr(data.error || "The card hold was not confirmed. Try again.");
      setBusy(false);
      return;
    }
    onPaid();
  }

  return (
    <form onSubmit={pay} className="mt-4 space-y-3">
      <PaymentElement />
      {err && <div className="text-sm text-hot">{err}</div>}
      <button className="btn btn-primary w-full" disabled={busy || !stripe}>{busy ? "Placing the hold…" : `Hold $${price}`}</button>
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
          <div><dt className="label">Admit one</dt><dd>{b.form.name}. {b.meta?.settled ?? (b.form.pass ? `Covered by your Season Pass. $${b.meta?.deposit ?? DEPOSIT} deposit held.` : `$${b.meta?.price} ticket and $${b.meta?.deposit ?? DEPOSIT} deposit held on your card.`)}</dd></div>
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

// Free cancellation until 24 hours before the party. After that the ticket is charged even for a no-show.
function Cancel({ b, onDone }: { b: Booking; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (b.meta?.settled) return null;
  const free = b.refundable || b.status === "reviewed";
  async function cancel() {
    if (!confirm("Cancel this booking?")) return;
    setBusy(true);
    setErr("");
    const res = await fetch("/api/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: b.id }) });
    if (!res.ok) setErr((await res.json()).error || "The booking could not be cancelled.");
    setBusy(false);
    onDone();
  }
  return (
    <div className="border-t border-line pt-4 text-sm text-white/70">
      {free ? (
        <>
          <p>Plans changed? Cancel for free until {CANCEL_HOURS} hours before the party.</p>
          <button className="btn btn-ghost mt-3" disabled={busy} onClick={cancel}>{busy ? "Cancelling…" : "Cancel my booking"}</button>
        </>
      ) : (
        <p>Less than {CANCEL_HOURS} hours to go, so this booking can no longer be cancelled. If you don&apos;t come, the ticket is still charged; the deposit is released.</p>
      )}
      {err && <p className="mt-2 text-hot">{err}</p>}
    </div>
  );
}
