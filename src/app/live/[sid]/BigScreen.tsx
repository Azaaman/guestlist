"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Avatar } from "@/components/ui";
import { ranked, useLive, type LiveData } from "@/components/useLive";

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
    QRCode.toDataURL(url, { margin: 1, width: 360 }).then(setQr);
    try { setPin(localStorage.getItem("gl_host_pin") ?? ""); } catch {}
  }, [sid]);

  async function host(action: string) {
    setBusy(action);
    setHostErr("");
    try {
      const res = await fetch(`/api/live/${sid}/host`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, pin, partyId: sid }) });
      const d = await res.json();
      if (!res.ok) setHostErr(d.error || "Failed");
      await refresh();
    } finally {
      setBusy("");
    }
  }

  const s = data?.state;
  return (
    <div className="glow min-h-screen px-6 py-6 lg:px-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="font-mono text-sm font-bold tracking-[0.25em]">GUEST<span className="text-brand-2">LIST</span></Link>
          <div className="mt-1 flex items-center gap-2 text-2xl font-black lg:text-3xl">
            <span className="live-dot h-3 w-3 rounded-full bg-red-500" /> {title}
          </div>
        </div>
        {s && s.status !== "lobby" && qr && (
          <div className="flex items-center gap-3">
            <div className="text-right text-sm text-white/70">Judges & guests:<br />scan to vote</div>
            <img src={qr} alt="Join QR" className="h-24 w-24 rounded-lg bg-white p-1" />
          </div>
        )}
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-500/15 p-3 text-red-200">{error}</div>}
      {!data && !error && <div className="mt-20 text-center text-white/60">Connecting…</div>}

      {data && s?.status === "lobby" && (
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[auto_1fr]">
          <div className="card p-6 text-center">
            <div className="label">Scan to join the party</div>
            {qr && <img src={qr} alt="Join QR" className="mx-auto mt-4 h-72 w-72 rounded-xl bg-white p-2" />}
            <div className="mt-3 break-all font-mono text-sm text-white/60">{joinUrl}</div>
          </div>
          <div>
            <div className="text-5xl font-black">{data.players.length} <span className="text-white/50">guests in</span></div>
            <p className="mt-2 text-white/65">When everyone is in, AI forms tonight&apos;s pairs and writes the contest program. Season members fill the room.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {data.players.map((p) => (
                <div key={p.id} className="card pop flex items-center gap-2 px-3 py-2"><Avatar name={p.name} size={30} /><span className="font-semibold">{p.name}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data && s?.status === "running" && <Running data={data} />}
      {data && s?.status === "finished" && <Finished data={data} />}

      {/* Host controls */}
      <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl border border-line bg-ink/90 p-2 backdrop-blur">
        <span className="px-2 font-mono text-xs text-white/50">HOST</span>
        {s?.status === "lobby" && (
          <button className="btn btn-primary" disabled={!!busy} onClick={() => host("setup")}>
            {busy === "setup" ? "AI is pairing everyone…" : "✨ Pair everyone & start"}
          </button>
        )}
        {s?.status === "running" && (
          <button className="btn btn-primary" disabled={!!busy} onClick={() => host("next")}>
            {s.phase === "open" ? "Reveal / close voting" : "Next →"}
          </button>
        )}
        <button className="btn btn-ghost" disabled={!!busy} onClick={() => { if (confirm("Reset the party? All guests and votes are cleared.")) host("reset"); }}>Reset</button>
        <input className="input w-20 py-2 text-sm" placeholder="PIN" value={pin} onChange={(e) => { setPin(e.target.value); try { localStorage.setItem("gl_host_pin", e.target.value); } catch {} }} />
        {hostErr && <span className="px-2 text-sm text-red-300">{hostErr}</span>}
      </div>
    </div>
  );
}

function Running({ data }: { data: LiveData }) {
  const s = data.state;
  const c = s.program[s.current];
  const q = c?.type === "quiz" ? c.questions?.[s.qIndex] : null;
  const order = ranked(data);
  return (
    <div className="mt-6 grid gap-6 pb-24 lg:grid-cols-[1.4fr_1fr]">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="label">Contest {s.current + 1} of {s.program.length}{q ? ` · Question ${s.qIndex + 1}/${c.questions!.length}` : ""}</div>
          <div className="font-mono text-sm text-white/60">{data.responses} {c?.type === "quiz" ? "answers" : "judges voted"}</div>
        </div>
        <div className="mt-3 text-4xl font-black">{c?.emoji} {c?.title}</div>
        <p className="mt-2 text-lg text-white/75">{c?.description}</p>
        {q && (
          <div className="mt-6">
            <div className="text-2xl font-bold lg:text-3xl">{q.q}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {q.options.map((o, i) => {
                const correct = s.phase === "reveal" && q.answer === i;
                return (
                  <div key={i} className={`rounded-xl border p-4 text-xl font-semibold ${correct ? "border-mint bg-mint/20" : "border-line bg-night"} ${s.phase === "reveal" && !correct ? "opacity-40" : ""}`}>
                    <span className="mr-2 font-mono text-brand-2">{"ABCD"[i]}</span>{o}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {c?.type === "vote" && (
          <div className="mt-6 rounded-xl border border-brand/50 bg-brand/10 p-5 text-xl">
            {s.phase === "open" ? "📱 Pairs perform — everyone rates each pair 1–5 on their phone." : "🔒 Voting closed — scores added."}
          </div>
        )}
      </div>
      <Leaderboard data={data} order={order} />
    </div>
  );
}

function Leaderboard({ data, order }: { data: LiveData; order: LiveData["state"]["pairs"] }) {
  return (
    <div className="card p-5">
      <div className="label">Tonight&apos;s leaderboard</div>
      <div className="mt-3 space-y-2">
        {order.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-3 rounded-xl p-3 ${i === 0 ? "bg-gold/15" : i === 1 ? "bg-silver/10" : i === 2 ? "bg-bronze/15" : "bg-night"}`}>
            <div className="w-6 text-center font-mono font-bold">{i + 1}</div>
            <div className="flex -space-x-2"><Avatar name={p.a.name} size={30} /><Avatar name={p.b.name} size={30} tone={3} /></div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{p.name}</div>
              <div className="truncate text-xs text-white/60">{p.a.name}{p.a.demo ? "" : " ★"} & {p.b.name}{p.b.demo ? "" : " ★"}</div>
            </div>
            <div className="text-2xl font-black">{data.scores.totals[p.id] ?? 0}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-white/45">★ joined live tonight · other guests are season members (simulated in this demo)</p>
    </div>
  );
}

function Finished({ data }: { data: LiveData }) {
  const order = ranked(data);
  const titles = ["🥇 Golden Couple of the night", "🥈 Silver Couple", "🥉 Bronze Couple"];
  return (
    <div className="mt-10 pb-24">
      <div className="text-center text-5xl font-black">Final results</div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {order.slice(0, 3).map((p, i) => (
          <div key={p.id} className={`card pop p-6 text-center ${i === 0 ? "border-gold" : ""}`} style={{ animationDelay: `${(2 - i) * 0.4}s` }}>
            <div className="text-lg font-bold">{titles[i]}</div>
            <div className="mt-2 text-3xl font-black">{p.name}</div>
            <div className="mt-1 text-white/70">{p.a.name} & {p.b.name}</div>
            <div className="mt-3 text-5xl font-black text-brand-2">{data.scores.totals[p.id] ?? 0}</div>
            <p className="mt-3 text-sm text-white/60">{p.why}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-white/65">Points added to the Season 1 race for the trip to Europe.</p>
    </div>
  );
}
