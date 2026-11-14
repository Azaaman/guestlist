"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Avatar } from "@/components/ui";
import { useLive, type LiveData } from "@/components/useLive";
import { PAYOUT_THRESHOLD, REPORTS_TO_BAN } from "@/lib/room";

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

  async function host(action: string, target?: string) {
    setBusy(target ? `${action}:${target}` : action);
    setHostErr("");
    try {
      const res = await fetch(`/api/live/${sid}/host`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, pin, partyId: sid, target }) });
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
          <Link href="/" className="wordmark text-3xl leading-none text-white/80">Nestly</Link>
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
        <button className="btn btn-ghost" disabled={!!busy} onClick={() => { if (confirm("Reset the party? Guests, reports and demo bans are cleared.")) host("reset"); }}>Reset</button>
        {hostErr && <span className="max-w-md px-2 text-sm text-hot">{hostErr}</span>}
      </div>
    </div>
  );
}

function Running({ data, busy, host }: { data: LiveData; busy: string; host: (action: string, target?: string) => void }) {
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
        <p className="mt-1 text-sm text-white/65">Private. {REPORTS_TO_BAN} reports from different guests ban automatically. One confirmed by the host bans at once.</p>
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
                <button className="btn bg-hot text-[#17103f]" disabled={!!busy} onClick={() => host("confirm", rep.id)}>Confirm and ban</button>
              </div>
            </li>
          ))}
        </ul>
        {r.banned.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <div className="font-semibold text-hot">Banned for good</div>
            <p className="mt-1 text-white/75">{r.banned.map((b) => b.name).join(", ")}. Removed tonight and blocked from applying again.</p>
          </div>
        )}
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
        <div><dt className="label">Banned tonight</dt><dd className="display mt-1 text-6xl">{r.banned.length}</dd></div>
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
      </div>
    </div>
  );
}
