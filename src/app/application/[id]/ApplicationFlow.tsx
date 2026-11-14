"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import QRCode from "qrcode";
import { Avatar } from "@/components/ui";
import { APPROVALS_NEEDED, type ApplicationRow } from "@/lib/types";

type App = ApplicationRow & { reveal: { address: string; dressCode: string } | null };

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export default function ApplicationFlow({ id, partyTitle, partyId, price, live }: { id: string; partyTitle: string; partyId: string; price: number; live: boolean }) {
  const [app, setApp] = useState<App | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/application/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) setErr(data.error || "Failed to load");
    else setApp(data);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (err) return <div className="mt-8 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{err}</div>;
  if (!app) return <div className="mt-8 text-white/60">Loading…</div>;

  return (
    <div className="mt-6 space-y-6">
      <ProfileCard app={app} />
      {app.status === "reviewed" && <PayStep id={id} price={price} onHeld={load} />}
      {app.status === "held" && <VotingStep app={app} onDecided={load} />}
      {app.status === "approved" && <Ticket app={app} partyTitle={partyTitle} partyId={partyId} live={live} />}
      {app.status === "rejected" && <Rejected app={app} />}
    </div>
  );
}

function ProfileCard({ app }: { app: App }) {
  const p = app.profile;
  const t = app.trust;
  if (!p) return null;
  return (
    <div className="card p-5 pop">
      <div className="label">AI profile card · what members see</div>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={app.form.name} size={56} />
        <div>
          <div className="text-xl font-extrabold">{app.form.name}, {app.form.age}</div>
          <div className="text-brand-2">{p.headline}</div>
        </div>
      </div>
      <p className="mt-3 text-white/85">{p.bio}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-md bg-brand/25 px-2 py-0.5 text-xs font-semibold">{p.vibe}</span>
        {p.strengths?.map((s) => <span key={s} className="rounded-md bg-night px-2 py-0.5 text-xs">{s}</span>)}
      </div>
      <p className="mt-3 text-sm text-white/60">Icebreaker: “{p.icebreaker}”</p>
      {t && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <div className="label">Trust score</div>
            <div className={`text-2xl font-black ${t.score >= 70 ? "text-mint" : t.score >= 45 ? "text-gold" : "text-red-300"}`}>{t.score}/100</div>
          </div>
          <div className="mt-2 grid gap-1 text-sm">
            {t.badges.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span>{b.ok ? "✅" : "⏳"}</span>
                <span className={b.ok ? "" : "text-white/55"}>{b.label}{b.note ? <span className="text-white/40"> — {b.note}</span> : null}</span>
              </div>
            ))}
          </div>
          {t.redFlags.length > 0 && (
            <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-200">⚠️ Red flags: {t.redFlags.join("; ")}</div>
          )}
        </div>
      )}
    </div>
  );
}

function PayStep({ id, price, onHeld }: { id: string; price: number; onHeld: () => void }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: id }) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Checkout failed");
    setSecret(data.clientSecret);
  }

  if (!stripePromise) return <div className="card p-4 text-red-200">Stripe publishable key is not configured.</div>;

  return (
    <div className="card p-5">
      <div className="label">Step 2 · Hold your spot</div>
      <h3 className="mt-2 text-xl font-extrabold">${price} hold → members vote</h3>
      <p className="mt-1 text-sm text-white/65">We place a temporary hold on your card. Approved by {APPROVALS_NEEDED}+ members → charged. Not approved → hold released, you pay $0.</p>
      {!secret ? (
        <>
          {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
          <button className="btn btn-primary mt-4 w-full" onClick={start} disabled={busy}>{busy ? "Preparing…" : `Hold $${price} & send to members`}</button>
        </>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance: { theme: "night", variables: { colorPrimary: "#6c5ce7" } } }}>
          <CardForm id={id} price={price} onHeld={onHeld} />
        </Elements>
      )}
      <p className="mt-3 text-xs text-white/45">Test mode — use card 4242 4242 4242 4242, any future date, any CVC.</p>
    </div>
  );
}

function CardForm({ id, price, onHeld }: { id: string; price: number; onHeld: () => void }) {
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
      setErr(error.message || "Payment failed");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: id }) });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Hold failed");
      setBusy(false);
      return;
    }
    onHeld();
  }

  return (
    <form onSubmit={pay} className="mt-4 space-y-3">
      <PaymentElement />
      {err && <div className="text-sm text-red-300">{err}</div>}
      <button className="btn btn-primary w-full" disabled={busy || !stripe}>{busy ? "Placing hold…" : `Place $${price} hold`}</button>
    </form>
  );
}

function VotingStep({ app, onDecided }: { app: App; onDecided: () => void }) {
  const votes = useMemo(() => app.votes ?? [], [app.votes]);
  const [shown, setShown] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (shown < votes.length) {
      const t = setTimeout(() => setShown((s) => s + 1), 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      const res = await fetch("/api/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: app.id }) });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Decision failed");
      else onDecided();
    }, 1200);
    return () => clearTimeout(t);
  }, [shown, votes.length, app.id, onDecided]);

  const yes = votes.slice(0, shown).filter((v) => v.vote === "yes").length;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="label">Step 3 · Members are voting</div>
        <div className="font-mono text-sm">{yes} / {APPROVALS_NEEDED} yes needed</div>
      </div>
      <div className="mt-4 space-y-2">
        {votes.map((v, i) => (
          <div key={v.voterId} className={`flex items-start gap-3 rounded-xl border border-line p-3 transition ${i < shown ? "pop" : "opacity-30"}`}>
            <Avatar name={v.voter} size={36} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{v.voter}</span>
                {i < shown ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${v.vote === "yes" ? "bg-mint/20 text-mint" : "bg-red-500/20 text-red-300"}`}>{v.vote === "yes" ? "YES" : "NO"}</span>
                ) : (
                  <span className="text-xs text-white/40">reading…</span>
                )}
              </div>
              {i < shown && <p className="text-sm text-white/70">“{v.reason}”</p>}
            </div>
          </div>
        ))}
      </div>
      {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
    </div>
  );
}

function Ticket({ app, partyTitle, partyId, live }: { app: App; partyTitle: string; partyId: string; live: boolean }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`GUESTLIST:${app.id}`, { margin: 1, width: 220 }).then(setQr);
  }, [app.id]);
  return (
    <div className="card overflow-hidden pop">
      <div className="bg-brand p-5">
        <div className="font-mono text-xs tracking-widest">YOU&apos;RE ON THE LIST</div>
        <div className="mt-1 text-2xl font-black">{partyTitle}</div>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div><div className="label">Address (unlocked)</div><div className="mt-1 text-lg font-bold">📍 {app.reveal?.address}</div></div>
          <div><div className="label">Dress code</div><div className="mt-1">{app.reveal?.dressCode}</div></div>
          <div className="text-sm text-white/65">Card charged. Show this QR at the door — the host checks you in and Party Mode starts on your phone.</div>
          {live && <Link href={`/play/${partyId}`} className="btn btn-primary">Open Party Mode →</Link>}
        </div>
        {qr && <img src={qr} alt="Check-in QR" className="h-44 w-44 rounded-xl bg-white p-2" />}
      </div>
    </div>
  );
}

function Rejected({ app }: { app: App }) {
  const yes = (app.votes ?? []).filter((v) => v.vote === "yes").length;
  return (
    <div className="card p-5">
      <div className="label">Not this time</div>
      <h3 className="mt-2 text-xl font-extrabold">{yes} of {APPROVALS_NEEDED} approvals</h3>
      <p className="mt-2 text-white/70">Your card hold was released — you were charged <b>$0</b>. Read the members&apos; feedback, update your application and try another party.</p>
      <div className="mt-3 space-y-1 text-sm text-white/60">
        {(app.votes ?? []).map((v) => <div key={v.voterId}>{v.vote === "yes" ? "✅" : "❌"} {v.voter}: “{v.reason}”</div>)}
      </div>
      <Link href="/parties" className="btn btn-ghost mt-4">Browse other parties</Link>
    </div>
  );
}
