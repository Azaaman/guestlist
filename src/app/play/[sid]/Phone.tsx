"use client";
import { useEffect, useRef, useState } from "react";
import { CONTEST_SKILLS } from "@/lib/data";
import { Avatar } from "@/components/ui";
import { ranked, useLive, type LiveData } from "@/components/useLive";

type Act = (kind: "answer" | "vote" | "pulse" | "report" | "rate" | "again", value: number, target?: string) => void;

export default function Phone({ sid, title, hostName, ticket }: { sid: string; title: string; hostName: string; ticket: string | null }) {
  const key = `gl_player_${sid}`;
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setPlayerId(localStorage.getItem(key)); } catch {}
    setReady(true);
  }, [key]);

  const joined = (id: string) => { try { localStorage.setItem(key, id); } catch {} setPlayerId(id); };
  const leave = () => { try { localStorage.removeItem(key); } catch {} setPlayerId(null); };

  if (!ready) return null;
  if (!playerId) return <Join sid={sid} title={title} ticket={ticket} onJoined={joined} />;
  return <Game sid={sid} title={title} hostName={hostName} playerId={playerId} onLeave={leave} />;
}

function Join({ sid, title, ticket, onJoined }: { sid: string; title: string; ticket: string | null; onJoined: (id: string) => void }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [skill, setSkill] = useState("Trivia");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const tried = useRef(false);

  async function join(payload: object) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/live/${sid}/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) setErr(d.error || "Could not join. Try again.");
      else onJoined(d.id);
    } catch {
      setErr("No connection. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  // Arriving with a ticket checks the guest in with the details from their application.
  useEffect(() => {
    if (ticket && !tried.current) {
      tried.current = true;
      join({ ticket });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  return (
    <div className="glow min-h-[calc(100vh-56px)] px-5 py-10">
      <div className="mx-auto max-w-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-hot"><span className="live-dot h-2 w-2 rounded-full bg-hot" />Live now</div>
        <h1 className="mt-2 text-4xl">{title}</h1>
        {ticket && busy ? (
          <p className="mt-6 text-white/75">Checking you in with your ticket…</p>
        ) : (
          <>
            <p className="mt-3 text-white/75">Join the party from your phone. AI pairs you with a partner for tonight&apos;s contests.</p>
            <form onSubmit={(e) => { e.preventDefault(); join({ name, gender, skill }); }} className="mt-6 space-y-4">
              <label className="block"><span className="label">Your first name</span><input className="input mt-1 text-lg" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} required /></label>
              <div>
                <span className="label">I am a</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {["man", "woman"].map((g) => (
                    <button type="button" key={g} onClick={() => setGender(g)} aria-pressed={gender === g}
                      className={`rounded-xl border px-4 py-3 font-semibold capitalize ${gender === g ? "border-brand-2 bg-brand-2/15" : "border-line"}`}>{g}</button>
                  ))}
                </div>
              </div>
              <label className="block"><span className="label">I&apos;m best at</span>
                <select className="input mt-1" value={skill} onChange={(e) => setSkill(e.target.value)}>{CONTEST_SKILLS.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              {err && <div className="rounded-lg bg-hot/15 p-3 text-sm text-white">{err}</div>}
              <button className="btn btn-primary w-full text-lg" disabled={busy || !gender}>{busy ? "Joining…" : "Join the party"}</button>
            </form>
          </>
        )}
        {ticket && err && <p className="mt-4 text-sm text-white/60">You can still join with your name above.</p>}
      </div>
    </div>
  );
}

function Game({ sid, title, hostName, playerId, onLeave }: { sid: string; title: string; hostName: string; playerId: string; onLeave: () => void }) {
  const { data, error, refresh } = useLive(sid, playerId, 1500);
  const [msg, setMsg] = useState("");

  const act: Act = async (kind, value, targetPair) => {
    setMsg("");
    try {
      const res = await fetch(`/api/live/${sid}/act`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId, kind, value, targetPair }) });
      const d = await res.json();
      if (!res.ok) setMsg(d.error || "That didn't go through. Try again.");
    } catch {
      setMsg("No connection. Try again.");
    }
    refresh();
  };

  if (!data) return <div className="p-8 text-center text-white/60">{error || "Connecting…"}</div>;
  const s = data.state;
  const me = data.players.find((p) => p.id === playerId);
  if (!me) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/75">The host restarted the party.</p>
        <button className="btn btn-primary mt-4" onClick={onLeave}>Join again</button>
      </div>
    );
  }
  const pair = s.pairs.find((p) => p.id === data.me?.pairId);
  const partner = pair ? (pair.a.id === playerId ? pair.b : pair.a) : null;
  const order = ranked(data);
  const rank = pair ? order.findIndex((p) => p.id === pair.id) + 1 : 0;

  return (
    <div className="mx-auto min-h-[calc(100vh-56px)] max-w-md px-4 pb-10 pt-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{title}</span>
        <span className="font-semibold">{me.name}, checked in</span>
      </div>

      {s.status === "lobby" && (
        <div className="mt-8 text-center">
          <h1 className="text-5xl">You&apos;re in</h1>
          <p className="mt-3 text-white/75">Waiting for the host to pair everyone. Keep this screen open.</p>
          <p className="mt-6 text-sm text-white/55">{data.players.length} {data.players.length === 1 ? "guest has" : "guests have"} joined from their phones</p>
        </div>
      )}

      {s.status !== "lobby" && pair && partner && (
        <div className="paper mt-4 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={partner.name} size={48} />
            <div className="min-w-0 flex-1">
              <div className="label">Your partner tonight</div>
              <div className="display text-2xl">{partner.name}</div>
              <div className="text-sm text-paper-ink/70">Together you are {pair.name}</div>
            </div>
            <div className="text-right">
              <div className="display text-3xl">{data.scores.totals[pair.id] ?? 0}</div>
              <div className="text-xs text-paper-ink/60">place {rank} of {order.length}</div>
            </div>
          </div>
          {pair.why && <p className="rule mt-3 pt-3 text-sm text-paper-ink/75">{pair.why}</p>}
        </div>
      )}
      {s.status !== "lobby" && !pair && (
        <div className="card mt-4 p-4 text-white/80">You joined after the pairing, so you are a judge tonight. Score the couples in the judged rounds.</div>
      )}

      {s.status === "running" && <Current data={data} myPairId={pair?.id ?? null} act={act} />}
      {msg && <div className="mt-3 rounded-lg bg-hot/15 p-3 text-sm">{msg}</div>}
      {s.status === "running" && <Pulse data={data} act={act} hostName={hostName} />}
      {s.status === "finished" && <After data={data} playerId={playerId} hostName={hostName} pairName={pair?.name ?? null} rank={rank} act={act} />}
    </div>
  );
}

function Current({ data, myPairId, act }: { data: LiveData; myPairId: string | null; act: Act }) {
  const s = data.state;
  const c = s.program[s.current];
  if (!c) return null;
  const q = c.type === "quiz" ? c.questions?.[s.qIndex] : null;
  const answered = data.me?.answered ?? null;

  return (
    <div className="mt-5">
      <div className="label">Round {s.current + 1} of {s.program.length}{q ? `, question ${s.qIndex + 1} of ${c.questions!.length}` : ""}</div>
      <h2 className="mt-1 text-3xl">{c.emoji} {c.title}</h2>
      {q && (
        <>
          <p className="mt-3 text-lg font-semibold">{q.q}</p>
          {!myPairId && <p className="mt-2 text-sm text-white/55">Judges sit this round out.</p>}
          <div className="mt-4 grid gap-2">
            {q.options.map((o, i) => {
              const picked = answered === i;
              const revealed = s.phase === "reveal" && q.answer !== null;
              const correct = revealed && q.answer === i;
              const wrongPick = revealed && picked && !correct;
              return (
                <button key={i} disabled={!myPairId || answered !== null || s.phase !== "open"} onClick={() => act("answer", i)}
                  className={`rounded-xl border p-4 text-left font-semibold ${correct ? "border-mint bg-mint/20" : wrongPick ? "border-hot bg-hot/20" : picked ? "border-brand-2 bg-brand-2/15" : "border-line bg-night"} disabled:cursor-default`}>
                  <span className="mr-2 text-brand-2">{"ABCD"[i]}</span>{o}
                </button>
              );
            })}
          </div>
          {answered !== null && s.phase === "open" && <p className="mt-3 text-center text-sm text-white/60">Answer locked. Wait for the reveal.</p>}
          {s.phase === "reveal" && answered !== null && (
            <p className="mt-3 text-center text-lg font-bold">{answered === q.answer ? "Correct, 10 points for your couple" : "Not this one"}</p>
          )}
        </>
      )}
      {c.type === "vote" && (
        <>
          <p className="mt-2 text-white/75">{c.description}</p>
          {s.phase === "open" ? (
            <div className="mt-4">
              {s.pairs.filter((p) => p.id !== myPairId).map((p) => {
                const mine = data.me?.votes?.[p.id];
                return (
                  <div key={p.id} className="border-t border-line py-3">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm text-white/55">{p.a.name} and {p.b.name}</div>
                    <div className="mt-2 grid grid-cols-5 gap-1.5" role="group" aria-label={`Score ${p.name}`}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} disabled={mine !== undefined} onClick={() => act("vote", v, p.id)}
                          className={`rounded-lg py-2.5 text-lg font-bold ${mine === v ? "bg-brand" : mine !== undefined ? "bg-night opacity-40" : "bg-panel hover:bg-brand/40"}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-white/70">Scoring is closed. Look at the big screen.</p>
          )}
        </>
      )}
    </div>
  );
}

// Live pulse and the safety button: how hosts are checked while the party is still running.
function Pulse({ data, act, hostName }: { data: LiveData; act: Act; hostName: string }) {
  const pulse = data.me?.pulse ?? null;
  return (
    <div className="mt-8 border-t border-line pt-4">
      {pulse === null ? (
        <>
          <div className="text-sm font-semibold">How is the night so far?</div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => act("pulse", v)} className="rounded-lg bg-panel py-2 font-bold hover:bg-brand-2/30">{v}</button>
            ))}
          </div>
          <p className="mt-1 text-xs text-white/50">1 is flat, 5 is great. {hostName} only sees the average.</p>
        </>
      ) : (
        <p className="text-sm text-white/60">You rated the night {pulse} out of 5 so far.</p>
      )}
      <div className="mt-4">
        {data.me?.reported ? (
          <p className="text-sm text-white/70">Reported. The host and the Guestlist safety team have been alerted.</p>
        ) : (
          <button onClick={() => { if (confirm("Alert the host and the Guestlist safety team?")) act("report", 1); }} className="text-sm font-semibold text-white/60 underline underline-offset-4 hover:text-white">
            Something is wrong, alert the host
          </button>
        )}
      </div>
    </div>
  );
}

function After({ data, playerId, hostName, pairName, rank, act }: { data: LiveData; playerId: string; hostName: string; pairName: string | null; rank: number; act: Act }) {
  const me = data.me;
  const people = data.state.pairs.flatMap((p) => [p.a, p.b]).filter((x) => x.id !== playerId);
  const place = ["Golden", "Silver", "Bronze"][rank - 1];
  return (
    <div className="mt-6">
      <h1 className="text-4xl">{pairName ? (place ? `${place} couple tonight` : `Place ${rank} tonight`) : "That's the night"}</h1>
      <p className="mt-2 text-white/70">{pairName ? `${pairName}'s points now count in the season race for Europe.` : "Thanks for judging."}</p>

      <h2 className="mt-8 text-2xl">Rate the night</h2>
      <p className="mt-1 text-sm text-white/60">{hostName} is paid only after guest ratings come in.</p>
      {([["party", "The party overall"], ["host", `${hostName} as a host`]] as const).map(([k, label]) => (
        <div key={k} className="mt-3">
          <div className="text-sm font-semibold">{label}</div>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => {
              const mine = me?.rates?.[k];
              return (
                <button key={v} disabled={mine !== undefined} onClick={() => act("rate", v, k)}
                  className={`rounded-lg py-2.5 font-bold ${mine === v ? "bg-brand" : mine !== undefined ? "bg-night opacity-40" : "bg-panel hover:bg-brand/40"}`}>{v}</button>
              );
            })}
          </div>
        </div>
      ))}

      <h2 className="mt-10 text-2xl">Who would you like to see again?</h2>
      <p className="mt-1 text-sm text-white/60">Private. A name is shared only if they pick you too.</p>
      <ul className="mt-3">
        {people.map((x) => {
          const picked = me?.again.includes(x.id);
          return (
            <li key={x.id} className="flex items-center gap-3 border-t border-line py-2.5">
              <Avatar name={x.name} size={34} />
              <span className="flex-1 font-semibold">{x.name}</span>
              <button disabled={picked} onClick={() => act("again", 1, x.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold ${picked ? "bg-brand-2 text-paper-ink" : "border border-line hover:bg-panel"}`}>{picked ? "Picked" : "See again"}</button>
            </li>
          );
        })}
      </ul>

      {me && me.matches.length > 0 && (
        <div className="paper pop mt-6 p-5">
          <div className="display text-2xl">It&apos;s mutual</div>
          <p className="mt-1 text-paper-ink/75">You and {me.matches.map((m) => m.name).join(", ")} both want to meet again. You can now message each other.</p>
          {me.matches.some((m) => m.demo) && <p className="mt-2 text-xs text-paper-ink/55">Season members are simulated in this demo. With two real phones, both people must pick each other.</p>}
        </div>
      )}
    </div>
  );
}
