"use client";
import { useEffect, useState } from "react";
import { CONTEST_SKILLS } from "@/lib/data";
import { Avatar } from "@/components/ui";
import { ranked, useLive, type LiveData } from "@/components/useLive";

export default function Phone({ sid, title }: { sid: string; title: string }) {
  const key = `gl_player_${sid}`;
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setPlayerId(localStorage.getItem(key)); } catch {}
    setReady(true);
  }, [key]);

  if (!ready) return null;
  if (!playerId) return <Join sid={sid} title={title} onJoined={(id) => { try { localStorage.setItem(key, id); } catch {} setPlayerId(id); }} />;
  return <Game sid={sid} title={title} playerId={playerId} onLeave={() => { try { localStorage.removeItem(key); } catch {} setPlayerId(null); }} />;
}

function Join({ sid, title, onJoined }: { sid: string; title: string; onJoined: (id: string) => void }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [skill, setSkill] = useState("Trivia");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/live/${sid}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, gender, skill }) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(d.error || "Could not join");
    onJoined(d.id);
  }
  return (
    <div className="glow min-h-[calc(100vh-56px)] px-5 py-10">
      <div className="mx-auto max-w-sm">
        <div className="label flex items-center gap-2"><span className="live-dot h-2 w-2 rounded-full bg-red-500" /> Live now</div>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mt-2 text-white/70">Join Party Mode. AI will pair you with a partner for tonight&apos;s contests.</p>
        <form onSubmit={join} className="mt-6 space-y-4">
          <label className="block"><span className="label">Your first name</span><input className="input mt-1 text-lg" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} required /></label>
          <div>
            <span className="label">I am a</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {["man", "woman"].map((g) => (
                <button type="button" key={g} onClick={() => setGender(g)} className={`rounded-xl border px-4 py-3 font-semibold capitalize ${gender === g ? "border-brand bg-brand/20" : "border-line"}`}>{g}</button>
              ))}
            </div>
          </div>
          <label className="block"><span className="label">Best at</span>
            <select className="input mt-1" value={skill} onChange={(e) => setSkill(e.target.value)}>{CONTEST_SKILLS.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          {err && <div className="text-sm text-red-300">{err}</div>}
          <button className="btn btn-primary w-full text-lg" disabled={busy || !gender}>{busy ? "Joining…" : "Join the party"}</button>
        </form>
      </div>
    </div>
  );
}

function Game({ sid, title, playerId, onLeave }: { sid: string; title: string; playerId: string; onLeave: () => void }) {
  const { data, error, refresh } = useLive(sid, playerId, 1500);
  const [msg, setMsg] = useState("");

  async function act(kind: "answer" | "vote", value: number, targetPair?: string) {
    setMsg("");
    const res = await fetch(`/api/live/${sid}/act`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId, kind, value, targetPair }) });
    const d = await res.json();
    if (!res.ok) setMsg(d.error || "Failed");
    refresh();
  }

  if (!data) return <div className="p-8 text-center text-white/60">{error || "Connecting…"}</div>;
  const s = data.state;
  const me = data.players.find((p) => p.id === playerId);
  if (!me && s.status === "lobby") {
    // party was reset — rejoin
    return (
      <div className="p-8 text-center">
        <p className="text-white/70">The host restarted the party.</p>
        <button className="btn btn-primary mt-4" onClick={onLeave}>Join again</button>
      </div>
    );
  }
  const pair = s.pairs.find((p) => p.id === data.me?.pairId);
  const partner = pair ? (pair.a.id === playerId ? pair.b : pair.a) : null;
  const order = ranked(data);
  const rank = pair ? order.findIndex((p) => p.id === pair.id) + 1 : 0;

  return (
    <div className="mx-auto min-h-[calc(100vh-56px)] max-w-md px-4 py-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">{title}</div>
        <div className="text-sm">{me?.name}</div>
      </div>

      {s.status === "lobby" && (
        <div className="card mt-6 p-6 text-center pop">
          <div className="text-5xl">🎉</div>
          <div className="mt-3 text-2xl font-black">You&apos;re in!</div>
          <p className="mt-2 text-white/70">Waiting for the host to pair everyone. Keep this screen open.</p>
          <p className="mt-4 font-mono text-sm text-white/50">{data.players.length} guests joined</p>
        </div>
      )}

      {s.status !== "lobby" && pair && partner && (
        <div className="card mt-4 p-4">
          <div className="label">Your team tonight</div>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={partner.name} size={44} />
            <div className="flex-1">
              <div className="font-extrabold">{pair.name}</div>
              <div className="text-sm text-white/70">with {partner.name}</div>
            </div>
            <div className="text-right"><div className="text-2xl font-black">{data.scores.totals[pair.id] ?? 0}</div><div className="text-xs text-white/50">#{rank} of {order.length}</div></div>
          </div>
          {pair.why && <p className="mt-2 text-sm text-white/60">✨ {pair.why}</p>}
        </div>
      )}
      {s.status !== "lobby" && !pair && (
        <div className="card mt-4 p-4 text-sm text-white/75">⚖️ You joined after pairing — you&apos;re a <b>judge</b> tonight. Rate the pairs in voting rounds.</div>
      )}

      {s.status === "running" && <Current data={data} playerId={playerId} myPairId={pair?.id ?? null} act={act} />}
      {msg && <div className="mt-3 rounded-lg bg-red-500/15 p-3 text-sm text-red-200">{msg}</div>}

      {s.status === "finished" && (
        <div className="card mt-6 p-6 text-center pop">
          <div className="text-5xl">{rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🎊"}</div>
          <div className="mt-2 text-2xl font-black">{pair ? `${pair.name}: #${rank}` : "That's a wrap!"}</div>
          <p className="mt-2 text-white/70">Points go to the season race for the Europe trip. See you next week.</p>
        </div>
      )}
    </div>
  );
}

function Current({ data, myPairId, act }: { data: LiveData; playerId: string; myPairId: string | null; act: (k: "answer" | "vote", v: number, t?: string) => void }) {
  const s = data.state;
  const c = s.program[s.current];
  if (!c) return null;
  const q = c.type === "quiz" ? c.questions?.[s.qIndex] : null;
  const answered = data.me?.answered;

  return (
    <div className="card mt-4 p-5">
      <div className="label">Contest {s.current + 1}/{s.program.length}{q ? ` · Q${s.qIndex + 1}` : ""}</div>
      <div className="mt-1 text-2xl font-black">{c.emoji} {c.title}</div>
      {q && (
        <>
          <div className="mt-3 text-lg font-semibold">{q.q}</div>
          {!myPairId && <p className="mt-2 text-sm text-white/55">Judges watch this round.</p>}
          <div className="mt-4 grid gap-2">
            {q.options.map((o, i) => {
              const picked = answered === i;
              const revealed = s.phase === "reveal" && q.answer !== null;
              const correct = revealed && q.answer === i;
              const wrongPick = revealed && picked && !correct;
              return (
                <button key={i} disabled={!myPairId || answered !== null || s.phase !== "open"} onClick={() => act("answer", i)}
                  className={`rounded-xl border p-4 text-left font-semibold transition ${correct ? "border-mint bg-mint/20" : wrongPick ? "border-red-400 bg-red-500/20" : picked ? "border-brand bg-brand/25" : "border-line bg-night"} disabled:cursor-default`}>
                  <span className="mr-2 font-mono text-brand-2">{"ABCD"[i]}</span>{o}
                </button>
              );
            })}
          </div>
          {answered !== null && s.phase === "open" && <p className="mt-3 text-center text-sm text-white/60">🔒 Locked in — wait for the reveal</p>}
          {s.phase === "reveal" && answered !== null && (
            <p className="mt-3 text-center text-lg font-bold">{answered === q.answer ? "✅ Correct! +10" : "❌ Not this time"}</p>
          )}
        </>
      )}
      {c.type === "vote" && (
        <>
          <p className="mt-2 text-white/75">{c.description}</p>
          {s.phase === "open" ? (
            <div className="mt-4 space-y-3">
              {s.pairs.filter((p) => p.id !== myPairId).map((p) => {
                const mine = data.me?.votes?.[p.id];
                return (
                  <div key={p.id} className="rounded-xl border border-line p-3">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-white/55">{p.a.name} & {p.b.name}</div>
                    <div className="mt-2 grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} disabled={mine !== undefined} onClick={() => act("vote", v, p.id)}
                          className={`rounded-lg py-2 text-lg font-bold ${mine === v ? "bg-brand" : mine !== undefined ? "bg-night opacity-40" : "bg-night hover:bg-brand/40"}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-center text-white/65">🔒 Voting closed. Check the big screen!</p>
          )}
        </>
      )}
    </div>
  );
}
