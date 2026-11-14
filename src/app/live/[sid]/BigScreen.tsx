"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Avatar } from "@/components/ui";
import { ranked, useLive, type LiveData } from "@/components/useLive";

const PAYOUT_THRESHOLD = 4.2;

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
    try { setPin(localStorage.getItem("gl_host_pin") ?? ""); } catch {}
  }, [sid]);

  async function host(action: string) {
    setBusy(action);
    setHostErr("");
    try {
      const res = await fetch(`/api/live/${sid}/host`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, pin, partyId: sid }) });
      const d = await res.json();
      if (!res.ok) setHostErr(d.error || "That didn't work. Try again.");
      await refresh();
    } catch {
      setHostErr("No connection. Try again.");
    } finally {
      setBusy("");
    }
  }

  const s = data?.state;
  return (
    <div className="glow min-h-screen px-6 pb-28 pt-6 lg:px-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link href="/" className="display text-xl text-white/70">Nestly</Link>
          <div className="mt-1 flex items-center gap-3">
            <span className="live-dot h-3 w-3 rounded-full bg-hot" />
            <h1 className="text-3xl lg:text-5xl">{title}</h1>
          </div>
          {data && s?.status !== "lobby" && (
            <p className="mt-2 text-white/65">
              {data.room.vibe !== null ? `Room pulse ${data.room.vibe} out of 5 from ${data.room.vibeCount} ${data.room.vibeCount === 1 ? "guest" : "guests"}` : "Room pulse appears when guests rate the night on their phones"}
              {data.room.reports > 0 && <span className="ml-3 font-bold text-hot">{data.room.reports} safety {data.room.reports === 1 ? "alert" : "alerts"} sent to the host</span>}
            </p>
          )}
        </div>
        {s && s.status !== "lobby" && qr && (
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right text-sm text-white/70">Scan to join<br />as a judge</div>
            <img src={qr} alt="QR code to join the party" className="h-24 w-24 rounded-md" />
          </div>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg bg-hot/15 p-3">{error}</div>}
      {!data && !error && <div className="mt-20 text-center text-white/60">Connecting…</div>}

      {data && s?.status === "lobby" && (
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[auto_1fr]">
          <div className="paper p-6 text-center">
            <div className="display text-2xl">Scan to join the party</div>
            {qr && <img src={qr} alt="QR code to join the party" className="mx-auto mt-3 h-72 w-72" />}
            <div className="mt-2 break-all text-sm text-paper-ink/70">{joinUrl}</div>
          </div>
          <div>
            <div className="display text-7xl">{data.players.length}</div>
            <div className="text-xl text-white/70">{data.players.length === 1 ? "guest has" : "guests have"} joined from their phones</div>
            <p className="mt-4 max-w-lg text-white/65">When everyone is in, the host starts the night. AI pairs the room into couples and writes tonight&apos;s contests. Season members fill the remaining places.</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {data.players.map((p) => (
                <li key={p.id} className="pop flex items-center gap-2 rounded-full border border-line py-1.5 pl-1.5 pr-4"><Avatar name={p.name} size={30} /><span className="font-semibold">{p.name}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data && s?.status === "running" && <Running data={data} />}
      {data && s?.status === "finished" && <Finished data={data} />}

      {/* Host controls */}
      <div className="fixed bottom-4 left-1/2 z-20 flex w-max max-w-[95vw] -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl border border-line bg-ink/95 p-2 pl-4 backdrop-blur">
        <span className="text-sm font-semibold text-white/55">Host</span>
        {s?.status === "lobby" && (
          <button className="btn btn-primary" disabled={!!busy} onClick={() => host("setup")}>
            {busy === "setup" ? "AI is pairing the room…" : "Pair everyone and start"}
          </button>
        )}
        {s?.status === "running" && (
          <button className="btn btn-primary" disabled={!!busy} onClick={() => host("next")}>
            {s.phase === "open" ? (s.program[s.current]?.type === "quiz" ? "Reveal the answer" : "Close scoring") : "Next"}
          </button>
        )}
        <button className="btn btn-ghost" disabled={!!busy} onClick={() => { if (confirm("Reset the party? All guests and scores are cleared.")) host("reset"); }}>Reset</button>
        <input className="input w-20 text-sm" placeholder="PIN" aria-label="Host PIN" value={pin} onChange={(e) => { setPin(e.target.value); try { localStorage.setItem("gl_host_pin", e.target.value); } catch {} }} />
        {hostErr && <span className="px-2 text-sm text-hot">{hostErr}</span>}
      </div>
    </div>
  );
}

function Running({ data }: { data: LiveData }) {
  const s = data.state;
  const c = s.program[s.current];
  const q = c?.type === "quiz" ? c.questions?.[s.qIndex] : null;
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="flex items-baseline justify-between text-white/65">
          <span>Round {s.current + 1} of {s.program.length}{q ? `, question ${s.qIndex + 1} of ${c.questions!.length}` : ""}</span>
          <span>{data.responses} {c?.type === "quiz" ? (data.responses === 1 ? "answer in" : "answers in") : (data.responses === 1 ? "judge has scored" : "judges have scored")}</span>
        </div>
        <h2 className="mt-2 text-5xl lg:text-6xl">{c?.emoji} {c?.title}</h2>
        <p className="mt-3 max-w-2xl text-xl text-white/75">{c?.description}</p>
        {q && (
          <div className="mt-8">
            <div className="text-2xl font-bold lg:text-3xl">{q.q}</div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {q.options.map((o, i) => {
                const correct = s.phase === "reveal" && q.answer === i;
                return (
                  <div key={i} className={`rounded-xl border p-4 text-xl font-semibold ${correct ? "border-mint bg-mint/20" : "border-line bg-night"} ${s.phase === "reveal" && !correct ? "opacity-40" : ""}`}>
                    <span className="mr-2 text-brand-2">{"ABCD"[i]}</span>{o}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {c?.type === "vote" && (
          <div className="mt-8 border-l-4 border-brand-2 pl-5 text-2xl">
            {s.phase === "open" ? "Couples perform. Everyone scores each couple from 1 to 5 on their phone." : "Scoring is closed. Points are on the board."}
          </div>
        )}
      </div>
      <Leaderboard data={data} />
    </div>
  );
}

function Leaderboard({ data }: { data: LiveData }) {
  const order = ranked(data);
  const medal = ["text-gold", "text-silver", "text-bronze"];
  return (
    <div>
      <div className="display text-2xl">Tonight&apos;s board</div>
      <ol className="mt-2">
        {order.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 border-t border-line py-3">
            <div className={`display w-8 text-center text-2xl ${medal[i] ?? "text-white/50"}`}>{i + 1}</div>
            <div className="flex -space-x-2"><Avatar name={p.a.name} size={34} /><Avatar name={p.b.name} size={34} tone={3} /></div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold">{p.name}</div>
              <div className="truncate text-sm text-white/60">{p.a.name} and {p.b.name}{!p.a.demo || !p.b.demo ? ", joined live" : ""}</div>
            </div>
            <div className="display price text-3xl">{data.scores.totals[p.id] ?? 0}</div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-white/45">Guests who joined by phone play for real. The other couples are season members, simulated in this demo.</p>
    </div>
  );
}

function Finished({ data }: { data: LiveData }) {
  const order = ranked(data);
  const titles = ["Golden couple", "Silver couple", "Bronze couple"];
  const colors = ["text-gold", "text-silver", "text-bronze"];
  const r = data.room;
  const released = r.hostRating !== null && r.hostRating >= PAYOUT_THRESHOLD;
  return (
    <div className="mt-10">
      <h2 className="text-5xl lg:text-7xl">Tonight&apos;s winners</h2>
      <ol className="mt-8 grid gap-8 lg:grid-cols-3">
        {order.slice(0, 3).map((p, i) => (
          <li key={p.id} className="pop border-t-4 border-line pt-4" style={{ animationDelay: `${(2 - i) * 0.5}s`, borderColor: i === 0 ? "var(--color-gold)" : undefined }}>
            <div className={`display text-2xl ${colors[i]}`}>{titles[i]}</div>
            <div className="display mt-1 text-4xl">{p.name}</div>
            <div className="mt-1 text-lg text-white/70">{p.a.name} and {p.b.name}</div>
            <div className="display mt-3 text-6xl">{data.scores.totals[p.id] ?? 0}</div>
            <p className="mt-2 text-white/60">{p.why}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 grid gap-6 border-t border-line pt-6 md:grid-cols-2">
        <p className="text-lg text-white/75">Tonight&apos;s points are added to the Season 1 race for the trip to Europe.</p>
        <div>
          <div className="text-lg font-bold">
            {r.ratingCount === 0 ? "Host payout is in escrow" : released ? "Host payout released" : "Host payout on hold"}
          </div>
          <p className="text-white/65">
            {r.ratingCount === 0
              ? "Guests are rating the night on their phones now. The host is paid once ratings come in."
              : `Guests rated the host ${r.hostRating} out of 5 (${r.ratingCount} ${r.ratingCount === 1 ? "rating" : "ratings"}). The payout needs ${PAYOUT_THRESHOLD} or higher.`}
          </p>
        </div>
      </div>
    </div>
  );
}
