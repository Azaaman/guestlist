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
export const stripeAppearance = {
  theme: "night" as const,
  variables: { colorPrimary: "#8f7dff", colorBackground: "#0f0a3d", colorText: "#ffffff", colorTextPlaceholder: "#cfc7ff", borderRadius: "10px" },
};

const STEPS = ["Profile", "Card hold", "Members vote", "Ticket"];

export default function ApplicationFlow({ id, partyTitle, partyId, partyWhen, price, live }: { id: string; partyTitle: string; partyId: string; partyWhen: string; price: number; live: boolean }) {
  const [app, setApp] = useState<App | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/application/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "This application could not be loaded.");
      else setApp(data);
    } catch {
      setErr("No connection. Reload the page to try again.");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (err) return <div className="mt-8 rounded-xl bg-hot/15 p-4">{err}</div>;
  if (!app) return <div className="mt-8 text-white/60">Loading your application…</div>;

  const step = app.status === "reviewed" ? 1 : app.status === "held" ? 2 : 3;
  return (
    <div className="mt-6 space-y-6">
      <ol className="flex gap-1 text-sm font-semibold">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex-1 border-t-2 pt-2 ${i <= step ? "border-brand-2 text-white" : "border-line text-white/40"}`}>{s}</li>
        ))}
      </ol>
      {app.status === "approved" && <Ticket app={app} partyTitle={partyTitle} partyId={partyId} partyWhen={partyWhen} live={live} />}
      {app.status === "rejected" && <Rejected app={app} />}
      {app.status === "held" && <VotingStep app={app} onDecided={load} />}
      {app.status === "reviewed" && <PayStep id={id} price={price} onHeld={load} />}
      <ProfileCard app={app} />
    </div>
  );
}

function ProfileCard({ app }: { app: App }) {
  const p = app.profile;
  const t = app.trust;
  if (!p) return null;
  return (
    <div className="paper p-5">
      <div className="label">Your profile card, written by AI from your application. This is what members read.</div>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={app.form.name} size={56} />
        <div>
          <div className="display text-2xl">{app.form.name}, {app.form.age}</div>
          <div className="font-semibold text-[#b0283f]">{p.headline}</div>
        </div>
      </div>
      <p className="mt-3">{p.bio}</p>
      <p className="mt-2 text-sm text-paper-ink/75">{p.vibe}. Good at: {p.strengths?.join(", ")}.</p>
      <p className="mt-2 text-sm text-paper-ink/65">Ask them: “{p.icebreaker}”</p>
      {t && (
        <div className="rule mt-4 pt-4">
          <div className="flex items-baseline justify-between">
            <div className="font-bold">Trust score</div>
            <div className="display text-3xl" style={{ color: t.score >= 70 ? "#1f8a5b" : t.score >= 45 ? "#a8690a" : "#b0283f" }}>{t.score} / 100</div>
          </div>
          <ul className="mt-2 grid gap-1 text-sm">
            {t.badges.map((b) => (
              <li key={b.label} className="flex items-baseline gap-2">
                <span className={`w-16 shrink-0 font-bold ${b.ok ? "text-[#1f8a5b]" : "text-paper-ink/45"}`}>{b.ok ? "Done" : "Pending"}</span>
                <span className={b.ok ? "" : "text-paper-ink/60"}>{b.label}{b.note ? `, ${b.note}` : ""}</span>
              </li>
            ))}
          </ul>
          {t.redFlags.length > 0 && (
            <div className="mt-3 rounded bg-[#b0283f]/10 p-3 text-sm font-semibold text-[#8f1f33]">Flagged by screening: {t.redFlags.join("; ")}</div>
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
      <h2 className="text-2xl">Hold <span className="price">${price}</span> to send your application</h2>
      <p className="mt-2 text-white/70">This is a hold, not a charge. If {APPROVALS_NEEDED} or more members approve you, the ${price} is charged and the address unlocks. If they don&apos;t, the hold is released and you pay $0.</p>
      {!secret ? (
        <>
          {err && <div className="mt-3 text-sm text-hot">{err}</div>}
          <button className="btn btn-primary mt-4 w-full" onClick={start} disabled={busy}>{busy ? "Preparing…" : `Hold $${price} and send to members`}</button>
        </>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance: stripeAppearance }}>
          <CardForm id={id} price={price} onHeld={onHeld} />
        </Elements>
      )}
      <p className="mt-3 text-sm text-white/50">Test mode. Use card 4242 4242 4242 4242, any future date, any CVC.</p>
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
      setErr(error.message || "The card was not accepted. Check the details and try again.");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: id }) });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "The hold was not confirmed. Try again.");
      setBusy(false);
      return;
    }
    onHeld();
  }

  return (
    <form onSubmit={pay} className="mt-4 space-y-3">
      <PaymentElement />
      {err && <div className="text-sm text-hot">{err}</div>}
      <button className="btn btn-primary w-full" disabled={busy || !stripe}>{busy ? "Placing the hold…" : `Hold $${price}`}</button>
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
      try {
        const res = await fetch("/api/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId: app.id }) });
        const data = await res.json();
        if (!res.ok) setErr(data.error || "The result could not be saved. Reload the page.");
        else onDecided();
      } catch {
        setErr("No connection. Reload the page.");
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [shown, votes.length, app.id, onDecided]);

  const yes = votes.slice(0, shown).filter((v) => v.vote === "yes").length;
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl">Members are voting</h2>
        <div className="display shrink-0 text-xl text-brand-2">{yes} of {APPROVALS_NEEDED} needed</div>
      </div>
      <p className="mt-1 text-sm text-white/60">Each member is played by AI in this demo, reading your card in their own voice.</p>
      <ul className="mt-3">
        {votes.map((v, i) => (
          <li key={v.voterId} className={`flex items-start gap-3 border-t border-line py-3 ${i < shown ? "pop" : "opacity-30"}`}>
            <Avatar name={v.voter} size={38} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">{v.voter}</span>
                {i < shown ? (
                  <span className={`rounded-full px-3 py-0.5 text-sm font-bold ${v.vote === "yes" ? "bg-mint/20 text-mint" : "bg-hot/20 text-hot"}`}>{v.vote === "yes" ? "Let them in" : "Not this time"}</span>
                ) : (
                  <span className="text-sm text-white/40">reading…</span>
                )}
              </div>
              {i < shown && <p className="text-white/75">“{v.reason}”</p>}
            </div>
          </li>
        ))}
      </ul>
      {err && <div className="mt-3 text-sm text-hot">{err}</div>}
    </div>
  );
}

function Ticket({ app, partyTitle, partyId, partyWhen, live }: { app: App; partyTitle: string; partyId: string; partyWhen: string; live: boolean }) {
  const [qr, setQr] = useState("");
  const path = `/play/${partyId}?ticket=${app.id}`;
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}${path}`, { margin: 0, width: 240, color: { dark: "#17103f", light: "#f2f2f2" } }).then(setQr);
  }, [path]);
  return (
    <div className="paper pop grid sm:grid-cols-[1fr_auto]">
      <div className="p-6">
        <div className="font-semibold text-[#1f8a5b]">Approved. You&apos;re on the list.</div>
        <div className="display mt-1 text-4xl">{partyTitle}</div>
        <div className="mt-1 font-semibold">{partyWhen}</div>
        <dl className="rule mt-4 space-y-3 pt-4">
          <div><dt className="label">Address, now unlocked</dt><dd className="text-lg font-bold">{app.reveal?.address}</dd></div>
          <div><dt className="label">Dress code</dt><dd>{app.reveal?.dressCode}</dd></div>
          <div><dt className="label">Admit one</dt><dd>{app.form.name}. Your card has been charged.</dd></div>
        </dl>
        {live && <Link href={path} className="btn btn-paper mt-5 w-full sm:w-auto">Check in and open Party Mode</Link>}
      </div>
      <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-paper-ink/30 p-6 sm:border-l sm:border-t-0">
        {qr && <img src={qr} alt="Check-in QR code" className="h-40 w-40" />}
        <div className="text-center text-sm text-paper-ink/70">Scan at the door<br />to check in</div>
      </div>
    </div>
  );
}

function Rejected({ app }: { app: App }) {
  const yes = (app.votes ?? []).filter((v) => v.vote === "yes").length;
  return (
    <div className="card p-5">
      <h2 className="text-2xl">Not approved this time</h2>
      <p className="mt-2 text-white/75">{yes} of the {APPROVALS_NEEDED} approvals needed. The hold on your card was released, so you paid $0. Read what members said, improve your application and apply to another night.</p>
      <ul className="mt-3">
        {(app.votes ?? []).map((v) => (
          <li key={v.voterId} className="border-t border-line py-2 text-white/75">
            <span className={`mr-2 font-bold ${v.vote === "yes" ? "text-mint" : "text-hot"}`}>{v.vote === "yes" ? "Yes" : "No"}</span>
            {v.voter}: “{v.reason}”
          </li>
        ))}
      </ul>
      <Link href="/parties" className="btn btn-ghost mt-4 w-full sm:w-auto">Browse other parties</Link>
    </div>
  );
}
