"use client";
// A guest's phone at a party: check-in, three introductions, room pulse, reports, appeal, ratings.
import { useEffect, useRef, useState } from "react";
import { INTERESTS, REPORT_REASONS, REPORTS_TO_BAN } from "@/lib/room";
import { Avatar } from "@/components/ui";
import { useLive, type LiveData } from "@/components/useLive";
import { fetchProfile, type SavedProfile } from "@/lib/profile";

type Act = (
  kind: "pulse" | "met" | "report" | "rate" | "again",
  value: number,
  target?: string,
) => Promise<void>;

export default function Phone({
  sid,
  title,
  hostName,
  ticket,
}: {
  sid: string;
  title: string;
  hostName: string;
  ticket: string | null;
}) {
  const key = `gl_player_${sid}`;
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setPlayerId(localStorage.getItem(key));
    } catch {}
    setReady(true);
  }, [key]);

  const joined = (id: string) => {
    try {
      localStorage.setItem(key, id);
    } catch {}
    setPlayerId(id);
  };
  const leave = () => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setPlayerId(null);
  };

  if (!ready) return null;
  if (!playerId) return <Join sid={sid} title={title} ticket={ticket} onJoined={joined} />;
  return <Room sid={sid} title={title} hostName={hostName} playerId={playerId} onLeave={leave} />;
}

function Join({
  sid,
  title,
  ticket,
  onJoined,
}: {
  sid: string;
  title: string;
  ticket: string | null;
  onJoined: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [into, setInto] = useState(INTERESTS[0]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const tried = useRef(false);
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  useEffect(() => {
    fetchProfile().then(setProfile);
  }, []);

  async function join(payload: object) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/live/${sid}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
        <div className="flex items-center gap-2 text-sm font-semibold text-hot">
          <span className="live-dot h-2 w-2 rounded-full bg-hot" />
          Live now
        </div>
        <h1 className="mt-2 text-4xl">{title}</h1>
        {ticket && busy ? (
          <p className="mt-6 text-white/75">Checking you in with your ticket…</p>
        ) : (
          <>
            <p className="mt-3 text-white/75">
              Check in from your phone. Nestly will suggest three people to meet tonight.
            </p>
            {profile && (
              <div className="mt-6">
                <button
                  className="btn btn-primary w-full text-lg"
                  disabled={busy}
                  onClick={() => join({ profileId: profile.id })}
                >
                  {busy ? "Checking in…" : `Check in as ${profile.form.name.split(" ")[0]}`}
                </button>
                <p className="mt-6 text-sm text-white/55">Or check in as someone else:</p>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                join({ name, gender, into });
              }}
              className="mt-6 space-y-4"
            >
              <label className="block">
                <span className="label">Your first name</span>
                <input
                  className="input mt-1 text-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  required
                />
              </label>
              <div>
                <span className="label">I am a</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {["man", "woman"].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGender(g)}
                      aria-pressed={gender === g}
                      className={`min-h-12 rounded-xl border px-4 py-3 font-semibold capitalize ${gender === g ? "border-brand-2 bg-brand/40" : "border-line"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="label">I&apos;m into</span>
                <select className="input mt-1" value={into} onChange={(e) => setInto(e.target.value)}>
                  {INTERESTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {err && <div className="rounded-lg bg-hot/15 p-3 text-sm">{err}</div>}
              <button className="btn btn-primary w-full text-lg" disabled={busy || !gender}>
                {busy ? "Checking in…" : "Check in"}
              </button>
            </form>
          </>
        )}
        {ticket && err && (
          <p className="mt-4 text-sm text-white/60">You can still check in with your name above.</p>
        )}
      </div>
    </div>
  );
}

function Room({
  sid,
  title,
  hostName,
  playerId,
  onLeave,
}: {
  sid: string;
  title: string;
  hostName: string;
  playerId: string;
  onLeave: () => void;
}) {
  const { data, error, refresh } = useLive(sid, playerId, 1500);
  const [msg, setMsg] = useState("");

  const act: Act = async (kind, value, target) => {
    setMsg("");
    try {
      const res = await fetch(`/api/live/${sid}/act`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, kind, value, target }),
      });
      const d = await res.json();
      if (!res.ok) setMsg(d.error || "That didn't go through. Try again.");
    } catch {
      setMsg("No connection. Try again.");
    }
    await refresh();
  };

  if (!data) return <div className="p-8 text-center text-white/60">{error || "Connecting…"}</div>;
  const me = data.players.find((p) => p.id === playerId);

  if (data.me?.removed)
    return <Removed sid={sid} playerId={playerId} conduct={data.me.conduct} onSent={refresh} />;
  if (!me) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/75">The host restarted the party.</p>
        <button className="btn btn-primary mt-4" onClick={onLeave}>
          Check in again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-56px)] max-w-md px-4 pb-12 pt-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{title}</span>
        <span className="font-semibold text-mint">{me.name}, checked in</span>
      </div>

      {data.status === "lobby" && (
        <div className="mt-10 text-center">
          <h1 className="text-5xl">You&apos;re in</h1>
          <p className="mt-3 text-white/75">
            When the host opens the room, you&apos;ll get three people to meet. Keep this screen open.
          </p>
          <p className="mt-6 text-sm text-white/55">
            {data.players.length} {data.players.length === 1 ? "guest has" : "guests have"} checked in
          </p>
        </div>
      )}

      {data.me?.damage && (
        <div className="card mt-4 border-hot/60 p-4">
          <div className="font-semibold text-hot">The host filed a damage claim</div>
          <p className="mt-1 text-white/85">
            {data.me.damage.note}: ${data.me.damage.amount}.{" "}
            {data.me.damage.card
              ? `$${data.me.damage.kept} was kept from your deposit.`
              : "No card hold was on file for you."}{" "}
            You can dispute this with Nestly within 48 hours.
          </p>
        </div>
      )}
      {data.status === "running" && <Intros data={data} act={act} />}
      {msg && <div className="mt-3 rounded-lg bg-hot/15 p-3 text-sm">{msg}</div>}
      {data.status === "running" && <Pulse data={data} act={act} hostName={hostName} />}
      {data.status === "running" && <Report data={data} playerId={playerId} hostName={hostName} act={act} />}
      {data.status === "finished" && <After data={data} playerId={playerId} hostName={hostName} act={act} />}
    </div>
  );
}

function Intros({ data, act }: { data: LiveData; act: Act }) {
  const intros = data.me?.intros ?? [];
  if (!intros.length)
    return (
      <div className="card mt-6 p-5">
        <div className="text-lg font-semibold">You arrived after the room opened</div>
        <p className="mt-1 text-white/75">
          Ask the host to match new arrivals and your three introductions will appear here.
        </p>
      </div>
    );
  return (
    <div className="mt-6">
      <h2 className="text-3xl">Three people to meet</h2>
      <p className="mt-1 text-sm text-white/65">Picked for you by AI from what everyone shared.</p>
      <ul className="mt-4 space-y-3">
        {intros.map((p) => {
          const met = data.me?.met.includes(p.id);
          return (
            <li key={p.id} className="paper p-4">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} size={44} />
                <div className="display flex-1 text-2xl">{p.name}</div>
                <button
                  disabled={met}
                  onClick={() => act("met", 1, p.id)}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${met ? "bg-[#1f8a5b] text-white" : "bg-paper-ink text-paper"}`}
                >
                  {met ? "Met" : "We met"}
                </button>
              </div>
              <p className="mt-3">{p.why}</p>
              <p className="rule mt-3 pt-3 text-sm text-paper-ink/75">Open with: “{p.icebreaker}”</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Pulse({ data, act, hostName }: { data: LiveData; act: Act; hostName: string }) {
  const pulse = data.me?.pulse ?? null;
  return (
    <div className="mt-8 border-t border-line pt-5">
      {pulse === null ? (
        <>
          <div className="font-semibold">How is the night so far?</div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => act("pulse", v)}
                className="min-h-12 rounded-lg bg-panel font-bold hover:bg-brand/50"
              >
                {v}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-white/50">
            1 is flat, 5 is great. {hostName} only sees the average.
          </p>
        </>
      ) : (
        <p className="text-sm text-white/65">You rated the night {pulse} out of 5 so far.</p>
      )}
    </div>
  );
}

// Report a specific guest. Reports are private; the host reviews them on the spot.
function Report({
  data,
  playerId,
  hostName,
  act,
}: {
  data: LiveData;
  playerId: string;
  hostName: string;
  act: Act;
}) {
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState("");
  const [reason, setReason] = useState(0);
  const [sent, setSent] = useState("");
  const others = data.people.filter((p) => p.id !== playerId && !data.me?.reported.includes(p.id));

  async function send() {
    const name =
      who === "host"
        ? `${hostName} (the host)`
        : (data.people.find((p) => p.id === who)?.name ?? "the guest");
    await act("report", reason, who);
    setSent(name);
    setOpen(false);
    setWho("");
  }

  return (
    <div className="mt-6 border-t border-line pt-5">
      {sent && (
        <p className="mb-3 rounded-lg bg-mint/15 p-3 text-sm">
          Your report about {sent} was sent to{" "}
          {sent.endsWith("(the host)") ? "Nestly, not to the host" : "the host"}. It stays private.
        </p>
      )}
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setSent("");
          }}
          className="btn btn-ghost w-full border-hot/60 text-hot"
        >
          Report someone
        </button>
      ) : (
        <div className="card p-4">
          <div className="text-lg font-semibold">Report someone</div>
          <p className="mt-1 text-sm text-white/70">
            The host reviews it right away. {REPORTS_TO_BAN} reports from different guests, or one the host
            confirms, removes the person from the party. A moderator then decides on a permanent ban. If
            anyone is in danger, call 911 first.
          </p>
          <label className="mt-4 block">
            <span className="label">Who</span>
            <select className="input mt-1" value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">Choose a person</option>
              {!data.me?.reported.includes("host") && (
                <option value="host">{hostName} (the host), goes to Nestly</option>
              )}
              {others.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="mt-4">
            <legend className="label">What happened</legend>
            <div className="mt-1 space-y-1.5">
              {REPORT_REASONS.map((r, i) => (
                <label
                  key={r}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 ${reason === i ? "border-brand-2 bg-brand/40" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    className="accent-[#b7abff]"
                    checked={reason === i}
                    onChange={() => setReason(i)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={!who} onClick={send}>
              Send report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Removed from tonight's party. Nothing is permanent until a moderator has read both sides.
function Removed({
  sid,
  playerId,
  conduct,
  onSent,
}: {
  sid: string;
  playerId: string;
  conduct: NonNullable<LiveData["me"]>["conduct"];
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function send() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/live/${sid}/appeal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, text }),
    });
    if (!res.ok) setErr((await res.json()).error || "The appeal could not be sent. Try again.");
    setBusy(false);
    onSent();
  }
  const status = conduct?.status ?? "open";
  return (
    <div className="mx-auto max-w-md px-5 py-12">
      {status === "open" && (
        <>
          <h1 className="text-4xl text-hot">You have been removed from tonight&apos;s party</h1>
          <p className="mt-4 text-white/85">
            Reason given: {conduct?.reasons.join(", ") || "reports from other guests"}. Please leave the house
            now.
          </p>
          <p className="mt-3 text-white/75">
            This is not yet a permanent ban. A Nestly moderator reviews the case and decides. You can tell
            your side first.
          </p>
          {conduct?.appealed ? (
            <p className="mt-5 rounded-xl bg-mint/15 p-4">
              Your appeal was sent. The moderator will read it before deciding. This page updates by itself.
            </p>
          ) : (
            <div className="mt-5">
              <label className="block">
                <span className="label">Your side of what happened</span>
                <textarea
                  className="input mt-1 min-h-28"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={600}
                />
              </label>
              {err && <p className="mt-2 text-sm text-hot">{err}</p>}
              <button className="btn btn-primary mt-3 w-full" disabled={busy || !text.trim()} onClick={send}>
                {busy ? "Sending…" : "Send my appeal"}
              </button>
            </div>
          )}
        </>
      )}
      {status === "cleared" && (
        <>
          <h1 className="text-4xl text-mint">The moderator cleared you</h1>
          <p className="mt-4 text-white/85">
            The reports were not upheld. Your profile is in good standing and you can book parties as before.
            We are sorry about tonight.
          </p>
        </>
      )}
      {status === "banned" && (
        <>
          <h1 className="text-4xl text-hot">You are permanently banned</h1>
          <p className="mt-4 text-white/85">
            A moderator reviewed the reports{conduct?.appealed ? " and your appeal" : ""} and upheld them. You
            can no longer book or check in to Nestly parties.
          </p>
          {conduct?.outcome?.pass && (
            <p className="mt-4 rounded-xl border border-line p-4 text-white/85">
              Your Season Pass was cancelled.{" "}
              <span className="price font-semibold">${conduct.outcome.refund}</span> for the unused parties
              has been refunded to your card. A ${conduct.outcome.fee} conduct fee was kept, as set out in the
              house rules.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function After({
  data,
  playerId,
  hostName,
  act,
}: {
  data: LiveData;
  playerId: string;
  hostName: string;
  act: Act;
}) {
  const me = data.me;
  const people = data.people.filter((x) => x.id !== playerId);
  return (
    <div className="mt-6">
      <h1 className="text-4xl">That&apos;s the night</h1>

      <h2 className="mt-8 text-2xl">Rate the host</h2>
      <p className="mt-1 text-sm text-white/65">{hostName} is paid only after guest ratings come in.</p>
      {(
        [
          ["host", `${hostName} as a host`],
          ["party", "The party overall"],
        ] as const
      ).map(([k, label]) => (
        <div key={k} className="mt-3">
          <div className="text-sm font-semibold">{label}</div>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => {
              const mine = me?.rates?.[k];
              return (
                <button
                  key={v}
                  disabled={mine !== undefined}
                  onClick={() => act("rate", v, k)}
                  className={`min-h-12 rounded-lg font-bold ${mine === v ? "bg-hi text-[#17103f]" : mine !== undefined ? "bg-night opacity-40" : "bg-panel hover:bg-brand/50"}`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <h2 className="mt-10 text-2xl">Who would you like to see again?</h2>
      <p className="mt-1 text-sm text-white/65">Private. A name is shared only if they pick you too.</p>
      <ul className="mt-3">
        {people.map((x) => {
          const picked = me?.again.includes(x.id);
          return (
            <li key={x.id} className="flex items-center gap-3 border-t border-line py-2.5">
              <Avatar name={x.name} size={34} />
              <span className="flex-1 font-semibold">{x.name}</span>
              <button
                disabled={picked}
                onClick={() => act("again", 1, x.id)}
                className={`min-h-10 rounded-full px-4 text-sm font-bold ${picked ? "bg-hi text-[#17103f]" : "border border-line hover:bg-panel"}`}
              >
                {picked ? "Picked" : "See again"}
              </button>
            </li>
          );
        })}
      </ul>

      {me && me.matches.length > 0 && (
        <div className="paper pop mt-6 p-5">
          <div className="display text-2xl">New friends</div>
          <p className="mt-1 text-paper-ink/80">
            You and {me.matches.map((m) => m.name).join(", ")} both want to meet again. Nestly shares your
            contacts with each other.
          </p>
          {me.matches.some((m) => m.demo) && (
            <p className="mt-2 text-xs text-paper-ink/60">
              Club members are simulated in this demo. With two real phones, both people must pick each other.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
