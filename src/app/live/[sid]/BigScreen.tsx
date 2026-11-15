"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Avatar } from "@/components/ui";
import { useLive, type LiveData } from "@/components/useLive";
import { DEPOSIT, PAYOUT_THRESHOLD, REPORTS_TO_BAN } from "@/lib/room";

export default function BigScreen({ sid, title }: { sid: string; title: string }) {
  const { data, error, refresh } = useLive(sid);
  const [qr, setQr] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [busy, setBusy] = useState("");
  const [hostErr, setHostErr] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/play/${sid}`;
    setJoinUrl(url);
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#17103f", light: "#f2f2f2" } }).then(setQr);
    // Optional host PIN comes from the link (?pin=...), only needed if LIVE_HOST_PIN is set.
    setPin(new URLSearchParams(window.location.search).get("pin") ?? "");
  }, [sid]);

  async function host(action: string, target?: string, extra?: { amount: number; note: string }) {
    setBusy(target ? `${action}:${target}` : action);
    setHostErr("");
    try {
      const res = await fetch(`/api/live/${sid}/host`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, pin, partyId: sid, target, ...extra }) });
      const d = await res.json();
      if (!res.ok) setHostErr(d.error || "That didn't work. Try again.");
      await refresh();
    } catch {
      setHostErr("No connection. Try again.");
    } finally {
      setBusy("");
    }
  }

  const status = data?.status;
  return (
    <div className="glow min-h-screen px-6 pb-32 pt-6 lg:px-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link href="/" className="wordmark text-2xl leading-none text-white/80">Nestly</Link>
          <div className="mt-2 flex items-center gap-3">
            <span className="live-dot h-3 w-3 rounded-full bg-hot" />
            <h1 className="text-3xl lg:text-5xl">{title}</h1>
          </div>
        </div>
        {status && status !== "lobby" && qr && (
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right text-sm text-white/70">Just arrived?<br />Scan to check in</div>
            <img src={qr} alt="QR code to check in" className="h-24 w-24 rounded-md" />
          </div>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg bg-hot/15 p-3">{error}</div>}
      {!data && !error && <div className="mt-20 text-center text-white/60">Connecting…</div>}

      {data && status === "lobby" && (
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[auto_1fr]">
          <div className="paper p-6 text-center">
            <div className="display text-2xl">Scan to check in</div>
            {qr && <img src={qr} alt="QR code to check in" className="mx-auto mt-3 h-72 w-72" />}
            <div className="mt-2 break-all text-sm text-paper-ink/70">{joinUrl}</div>
          </div>
          <div>
            <div className="display price text-7xl">{data.players.length}</div>
            <div className="text-xl text-white/75">{data.players.length === 1 ? "guest has" : "guests have"} checked in from their phones</div>
            <p className="mt-4 max-w-lg text-white/65">When people have arrived, the host opens the room. AI then gives every guest three people to meet and a line to open with.</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {data.players.map((p) => (
                <li key={p.id} className="pop flex items-center gap-2 rounded-full border border-line py-1.5 pl-1.5 pr-4"><Avatar name={p.name} size={30} /><span className="font-semibold">{p.name}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data && status === "running" && <Running data={data} busy={busy} host={host} />}
      {data && status === "finished" && <Finished data={data} />}

      {/* Host controls */}
      <div className="fixed bottom-4 left-1/2 z-20 flex w-max max-w-[95vw] -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl border border-line bg-ink/95 p-2 pl-4 backdrop-blur">
        <span className="text-sm font-semibold text-white/55">Host</span>
        {status === "lobby" && (
          <button className="btn btn-primary" disabled={!!busy} onClick={() => host("open")}>
            {busy === "open" ? "AI is introducing everyone…" : "Open the room"}
          </button>
        )}
        {status === "running" && (
          <>
            <button className="btn btn-ghost" disabled={!!busy} onClick={() => host("open")}>{busy === "open" ? "Matching…" : "Match new arrivals"}</button>
            <button className="btn btn-primary" disabled={!!busy} onClick={() => host("end")}>End the party</button>
          </>
        )}
        <button className="btn btn-ghost" disabled={!!busy} onClick={() => { if (confirm("Reset the party? Guests, reports, cases and demo bans are cleared.")) host("reset"); }}>Reset</button>
        {hostErr && <span className="max-w-md px-2 text-sm text-hot">{hostErr}</span>}
      </div>
    </div>
  );
}

function Running({ data, busy, host }: { data: LiveData; busy: string; host: (action: string, target?: string, extra?: { amount: number; note: string }) => void }) {
  const r = data.room;
  const live = data.people.filter((p) => !p.demo).length;
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <dl className="grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center">
          <div><dt className="label">In the room</dt><dd className="display mt-1 text-5xl">{data.people.length}</dd><dd className="text-sm text-white/55">{live} checked in by phone</dd></div>
          <div><dt className="label">Introductions made</dt><dd className="display price mt-1 text-5xl">{r.met}</dd><dd className="text-sm text-white/55">guests tapped “We met”</dd></div>
          <div><dt className="label">Room pulse</dt><dd className="display mt-1 text-5xl">{r.vibe ?? "–"}</dd><dd className="text-sm text-white/55">{r.vibeCount ? `out of 5, from ${r.vibeCount}` : "no ratings yet"}</dd></div>
        </dl>
        <h2 className="mt-8 text-2xl">On the list tonight</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {data.people.map((p) => (
            <li key={p.id} className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 ${p.demo ? "border-line" : "border-hi"}`}>
              <Avatar name={p.name} size={32} /><span className="font-semibold">{p.name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-white/50">Gold outline: checked in by phone tonight. The rest are club members, simulated in this demo.</p>
      </div>

      <div>
        <h2 className="text-2xl">Reports for the host</h2>
        <p className="mt-1 text-sm text-white/65">Private. {REPORTS_TO_BAN} reports from different guests remove the person automatically; so does one you confirm. A Nestly moderator then decides on a permanent ban.</p>
        {r.reports.length === 0 && <p className="mt-4 border-t border-line pt-4 text-white/60">No reports. Guests can report someone from their phone.</p>}
        <ul className="mt-4">
          {r.reports.map((rep) => (
            <li key={rep.id} className="pop border-t border-line py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-bold">{rep.name}</span>
                <span className="font-semibold text-hot">{rep.count} of {REPORTS_TO_BAN} reports</span>
              </div>
              <p className="mt-1 text-white/75">{rep.reasons.join(", ")}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" disabled={!!busy} onClick={() => host("dismiss", rep.id)}>Dismiss</button>
                <button className="btn bg-hot text-[#17103f]" disabled={!!busy} onClick={() => host("confirm", rep.id)}>Confirm and remove</button>
              </div>
            </li>
          ))}
        </ul>
        {r.removed.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <div className="font-semibold text-hot">Removed tonight</div>
            <ul className="mt-1 text-white/80">
              {r.removed.map((b) => (
                <li key={b.id}>
                  {b.name}: {b.status === "open" ? "with the moderator, who decides on a permanent ban." : b.status === "cleared" ? "cleared by the moderator." : `permanently banned.${b.outcome?.pass ? ` Season Pass cancelled, $${b.outcome.refund} refunded, $${b.outcome.fee} conduct fee kept.` : ""}`}
                </li>
              ))}
            </ul>
          </div>
        )}
        <DamageClaim data={data} busy={busy} host={host} />
      </div>
    </div>
  );
}

function Finished({ data }: { data: LiveData }) {
  const r = data.room;
  const released = r.hostRating !== null && r.hostRating >= PAYOUT_THRESHOLD;
  return (
    <div className="mt-10">
      <h2 className="text-5xl lg:text-7xl">That&apos;s the night</h2>
      <dl className="mt-8 grid gap-6 border-y border-line py-6 text-center sm:grid-cols-3">
        <div><dt className="label">Introductions made</dt><dd className="display price mt-1 text-6xl">{r.met}</dd></div>
        <div><dt className="label">Host rating</dt><dd className="display mt-1 text-6xl">{r.hostRating ?? "–"}</dd><dd className="text-sm text-white/55">{r.ratingCount ? `from ${r.ratingCount} ${r.ratingCount === 1 ? "guest" : "guests"}` : "guests are rating now"}</dd></div>
        <div><dt className="label">Removed tonight</dt><dd className="display mt-1 text-6xl">{r.removed.length}</dd></div>
      </dl>
      <div className="mt-6">
        <div className={`text-xl font-bold ${r.ratingCount === 0 ? "" : released ? "text-mint" : "text-hot"}`}>
          {r.ratingCount === 0 ? "Host payout is in escrow" : released ? "Host payout released" : "Host payout on hold"}
        </div>
        <p className="mt-1 text-white/70">
          {r.ratingCount === 0
            ? "Guests are rating the host on their phones. The host is paid once ratings come in."
            : `The payout needs a rating of ${PAYOUT_THRESHOLD} or higher.`}
        </p>
        <p className="mt-3 text-white/70">Tickets have been charged, including no-shows, and damage deposits released{r.damage.length ? `, except ${r.damage.length} with a damage claim` : ""}.</p>
      </div>
    </div>
  );
}

// The host records damage by one guest. Up to the deposit comes off that guest's card hold.
function DamageClaim({ data, busy, host }: { data: LiveData; busy: string; host: (action: string, target?: string, extra?: { amount: number; note: string }) => void }) {
  const [who, setWho] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const claimed = new Set(data.room.damage.map((d) => d.id));
  const guests = data.people.filter((p) => !p.demo && !claimed.has(p.id));
  return (
    <div className="mt-8 border-t border-line pt-5">
      <h2 className="text-2xl">Damage claim</h2>
      <p className="mt-1 text-sm text-white/65">Every booking carries a ${DEPOSIT} deposit hold. A claim is taken from it; anything above is covered by Nestly.</p>
      {data.room.damage.map((d) => (
        <p key={d.id} className="mt-3 rounded-xl border border-line p-3 text-white/85">
          {d.name}: {d.note}, ${d.amount}. {d.card ? `$${d.kept} kept from the deposit` : "No card hold on file (walk-up check-in)"}{d.covered > 0 ? `, $${d.covered} covered by Nestly host protection.` : "."}
        </p>
      ))}
      {guests.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_7rem]">
          <select className="input" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Guest">
            <option value="">Choose a guest</option>
            {guests.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className="input" inputMode="numeric" placeholder="Cost, $" aria-label="Cost in dollars" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
          <input className="input sm:col-span-2" placeholder="What was damaged" aria-label="What was damaged" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          <button className="btn btn-ghost sm:col-span-2" disabled={!!busy || !who || !amount} onClick={() => { host("damage", who, { amount: Number(amount), note }); setWho(""); setAmount(""); setNote(""); }}>File the claim</button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/55">Claims can be filed against guests who checked in tonight.</p>
      )}
    </div>
  );
}
