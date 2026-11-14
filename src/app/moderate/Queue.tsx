"use client";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui";

interface Item {
  id: string;
  form: { name: string; age: number; gender: string; into?: string; lookingFor: string; about: string; instagram?: string; inviteCode?: string };
  card: { headline: string; moderatorNote?: string } | null;
  trust: { score: number; redFlags: string[] } | null;
}

interface Case {
  id: string;
  kind: "guest" | "host";
  name: string;
  by: "reports" | "host" | "guest";
  reasons: string[];
  reporters: number;
  appeal?: string;
  status: "open" | "banned" | "cleared";
  outcome?: { pass: boolean; refund: number; fee: number };
}

export default function Queue() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/moderate", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) setErr(d.error || "The queue could not be loaded.");
      else {
        setErr("");
        setItems(d.queue);
        setCases(d.cases ?? []);
      }
    } catch {
      setErr("No connection. Retrying…");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(id);
    const res = await fetch("/api/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    if (!res.ok) setErr((await res.json()).error || "That didn't work. Try again.");
    await load();
    setBusy("");
  }

  async function rule(caseId: string, decision: "ban" | "clear") {
    setBusy(caseId);
    const res = await fetch("/api/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId, decision }) });
    if (!res.ok) setErr((await res.json()).error || "That didn't work. Try again.");
    await load();
    setBusy("");
  }

  if (!items) return <p className="mt-8 text-white/60">{err || "Loading…"}</p>;
  return (
    <div className="mt-8">
      {err && <div className="mb-4 rounded-xl bg-hot/15 p-3 text-sm">{err}</div>}
      <h2 className="text-2xl">New profiles</h2>
      {items.length === 0 && <p className="mt-3 border-t border-line pt-5 text-white/70">Nobody is waiting. New profiles appear here as soon as AI screening passes them.</p>}
      <ul>
        {items.map((it) => (
          <li key={it.id} className="border-t border-line py-5">
            <div className="flex items-center gap-3">
              <Avatar name={it.form.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold">{it.form.name}, {it.form.age}, {it.form.gender}</div>
                <div className="text-sm text-white/65">{it.card?.headline}</div>
              </div>
              {it.trust && <div className="display price text-3xl">{it.trust.score}</div>}
            </div>
            <p className="mt-3">{it.form.about}</p>
            <p className="mt-1 text-sm text-white/70">Looking for: {it.form.lookingFor}. Into {it.form.into?.toLowerCase()}. {it.form.inviteCode ? "Invited by a member." : "No invite."} {it.form.instagram ? `Instagram ${it.form.instagram}.` : "No social profile."}</p>
            {it.card?.moderatorNote && <p className="mt-2 rounded-xl border border-line p-3 text-sm"><span className="font-semibold text-brand-2">AI note:</span> {it.card.moderatorNote}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" disabled={busy === it.id} onClick={() => decide(it.id, "reject")}>Reject</button>
              <button className="btn bg-mint text-[#17103f]" disabled={busy === it.id} onClick={() => decide(it.id, "approve")}>Approve</button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl">Conduct cases</h2>
      <p className="mt-1 text-sm text-white/65">Guests removed from a party, and reports about hosts. The removal already happened; you decide whether the ban is permanent.</p>
      {cases.length === 0 && <p className="mt-3 border-t border-line pt-5 text-white/70">No cases. They appear here when a guest is removed or a host is reported.</p>}
      <ul className="mt-3">
        {cases.map((c) => (
          <li key={c.id} className="border-t border-line py-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-bold">{c.name}{c.kind === "host" ? ", host" : ""}</span>
              <span className={`text-sm font-semibold ${c.status === "open" ? "text-hi" : c.status === "banned" ? "text-hot" : "text-mint"}`}>{c.status === "open" ? "Waiting for a decision" : c.status === "banned" ? "Banned" : "Cleared"}</span>
            </div>
            <p className="mt-1 text-white/85">{c.reasons.join(", ")}</p>
            <p className="mt-1 text-sm text-white/65">
              {c.by === "host" ? `Removed by the host after ${c.reporters} ${c.reporters === 1 ? "report" : "reports"}.` : c.by === "reports" ? `Removed automatically: ${c.reporters} guests reported them.` : `Reported by ${c.reporters} ${c.reporters === 1 ? "guest" : "guests"}. The host has not been told.`}
            </p>
            <p className="mt-2 rounded-xl border border-line p-3 text-sm"><span className="font-semibold text-brand-2">Their side:</span> {c.appeal ?? "No appeal sent yet."}</p>
            {c.status === "banned" && c.outcome?.pass && <p className="mt-2 text-sm text-white/75">Season Pass cancelled: ${c.outcome.refund} refunded, ${c.outcome.fee} conduct fee kept.</p>}
            {c.status === "open" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn bg-mint text-[#17103f]" disabled={busy === c.id} onClick={() => rule(c.id, "clear")}>Clear, no ban</button>
                <button className="btn bg-hot text-[#17103f]" disabled={busy === c.id} onClick={() => rule(c.id, "ban")}>Ban permanently</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
