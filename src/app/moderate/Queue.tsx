"use client";
// Moderator desk: host applications with their files, and conduct cases from parties.
import { useCallback, useEffect, useState } from "react";

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

interface HostApp {
  id: string;
  status: "pending" | "approved" | "rejected";
  form: {
    name: string;
    email: string;
    phone: string;
    neighborhood: string;
    address: string;
    capacity: number;
    occupancy: string;
    theme: string;
    title: string;
    about: string;
  };
  files: { id: (string | null)[]; ownership: (string | null)[]; photos: (string | null)[] };
}

export default function Queue() {
  const [cases, setCases] = useState<Case[] | null>(null);
  const [hosts, setHosts] = useState<HostApp[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/moderate", { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) setErr(d.error || "The queue could not be loaded.");
      else {
        setErr("");
        setCases(d.cases ?? []);
        setHosts(d.hosts ?? []);
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

  async function rule(caseId: string, decision: "ban" | "clear") {
    setBusy(caseId);
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, decision }),
    });
    if (!res.ok) setErr((await res.json()).error || "That didn't work. Try again.");
    await load();
    setBusy("");
  }

  async function decideHost(hostId: string, hostDecision: "approve" | "reject") {
    const note = hostDecision === "reject" ? (prompt("Reason for the host (optional)") ?? "") : "";
    setBusy(hostId);
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostId, hostDecision, note }),
    });
    if (!res.ok) setErr((await res.json()).error || "That didn't work. Try again.");
    await load();
    setBusy("");
  }

  if (!cases) return <p className="mt-8 text-white/60">{err || "Loading…"}</p>;
  return (
    <div className="mt-8">
      {err && <div className="mb-4 rounded-xl bg-hot/15 p-3 text-sm">{err}</div>}

      <h2 className="text-2xl">Host applications</h2>
      <p className="mt-1 text-sm text-white/65">
        Check that the ID matches the name, that the papers show they may host at this address, and that the
        photos show a safe house.
      </p>
      {hosts.length === 0 && (
        <p className="mt-3 border-t border-line pt-5 text-white/70">
          No applications yet. They appear here when someone sends the host form.
        </p>
      )}
      <ul className="mt-3">
        {hosts.map((h) => (
          <li key={h.id} className="border-t border-line py-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-bold">
                {h.form.title} <span className="font-normal text-white/65">({h.form.theme})</span>
              </span>
              <span
                className={`text-sm font-semibold ${h.status === "pending" ? "text-hi" : h.status === "approved" ? "text-mint" : "text-hot"}`}
              >
                {h.status === "pending"
                  ? "Waiting for review"
                  : h.status === "approved"
                    ? "Approved"
                    : "Rejected"}
              </span>
            </div>
            <p className="mt-1 text-white/85">
              {h.form.name}, {h.form.occupancy === "owner" ? "owner" : "renter with permission"}.{" "}
              {h.form.email}, {h.form.phone}
            </p>
            <p className="text-sm text-white/65">
              {h.form.address}, {h.form.neighborhood}. Up to {h.form.capacity} guests.
            </p>
            {h.form.about && <p className="mt-1 text-sm text-white/75">“{h.form.about}”</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {h.files.id[0] && (
                <a
                  href={h.files.id[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost min-h-0 px-3 py-2"
                >
                  Open ID
                </a>
              )}
              {h.files.ownership[0] && (
                <a
                  href={h.files.ownership[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost min-h-0 px-3 py-2"
                >
                  Open {h.form.occupancy === "owner" ? "proof of ownership" : "lease / permission"}
                </a>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {h.files.photos.map(
                (u, i) =>
                  u && (
                    <a
                      key={i}
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-square overflow-hidden rounded-lg bg-night"
                    >
                      <img src={u} alt={`House photo ${i + 1}`} className="h-full w-full object-cover" />
                    </a>
                  ),
              )}
            </div>
            {h.status === "pending" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="btn btn-ghost"
                  disabled={busy === h.id}
                  onClick={() => decideHost(h.id, "reject")}
                >
                  Reject
                </button>
                <button
                  className="btn bg-mint text-[#17103f]"
                  disabled={busy === h.id}
                  onClick={() => decideHost(h.id, "approve")}
                >
                  Approve host
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl">Conduct cases</h2>
      <p className="mt-1 text-sm text-white/65">
        Guests removed from a party, and reports about hosts. The removal already happened; you decide whether
        the ban is permanent.
      </p>
      {cases.length === 0 && (
        <p className="mt-3 border-t border-line pt-5 text-white/70">
          No cases. They appear here when a guest is removed or a host is reported.
        </p>
      )}
      <ul className="mt-3">
        {cases.map((c) => (
          <li key={c.id} className="border-t border-line py-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-bold">
                {c.name}
                {c.kind === "host" ? ", host" : ""}
              </span>
              <span
                className={`text-sm font-semibold ${c.status === "open" ? "text-hi" : c.status === "banned" ? "text-hot" : "text-mint"}`}
              >
                {c.status === "open"
                  ? "Waiting for a decision"
                  : c.status === "banned"
                    ? "Banned"
                    : "Cleared"}
              </span>
            </div>
            <p className="mt-1 text-white/85">{c.reasons.join(", ")}</p>
            <p className="mt-1 text-sm text-white/65">
              {c.by === "host"
                ? `Removed by the host after ${c.reporters} ${c.reporters === 1 ? "report" : "reports"}.`
                : c.by === "reports"
                  ? `Removed automatically: ${c.reporters} guests reported them.`
                  : `Reported by ${c.reporters} ${c.reporters === 1 ? "guest" : "guests"}. The host has not been told.`}
            </p>
            <p className="mt-2 rounded-xl border border-line p-3 text-sm">
              <span className="font-semibold text-brand-2">Their side:</span>{" "}
              {c.appeal ?? "No appeal sent yet."}
            </p>
            {c.status === "banned" && c.outcome?.pass && (
              <p className="mt-2 text-sm text-white/75">
                Season Pass cancelled: ${c.outcome.refund} refunded, ${c.outcome.fee} conduct fee kept.
              </p>
            )}
            {c.status === "open" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="btn bg-mint text-[#17103f]"
                  disabled={busy === c.id}
                  onClick={() => rule(c.id, "clear")}
                >
                  Clear, no ban
                </button>
                <button
                  className="btn bg-hot text-[#17103f]"
                  disabled={busy === c.id}
                  onClick={() => rule(c.id, "ban")}
                >
                  Ban permanently
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
