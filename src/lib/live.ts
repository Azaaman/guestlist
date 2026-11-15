import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai";
import { getParty, MEMBERS, SEASON } from "@/lib/data";
import { stripe } from "@/lib/stripe";
import { DEPOSIT, passRefund } from "@/lib/room";
import type { ApplicationRow, BookingMeta } from "@/lib/types";

export interface Person {
  id: string;
  name: string;
  gender: "man" | "woman";
  demo: boolean; // simulated club member (fills the room for the demo)
  about?: string;
  profileId?: string; // set when the guest checked in with a saved profile or a ticket
}
export interface Intro {
  id: string;
  why: string;
  icebreaker: string;
}
export interface Damage {
  amount: number; // what the host claimed
  note: string;
  kept: number; // taken from the guest's deposit
  covered: number; // the rest, paid by Nestly's host protection
  card: boolean; // false when the guest had no card hold (demo walk-up)
}
export interface LiveState {
  status: "lobby" | "running" | "finished";
  people: Person[];
  intros: Record<string, Intro[]>; // guest id → the people they should meet tonight
  banned: string[]; // person ids removed from tonight's party
  dismissed: string[]; // person ids whose reports the host reviewed and dismissed
  damage: Record<string, Damage>;
}

export interface ActionRow {
  player_id: string;
  contest_index: number;
  question_index: number;
  kind: string; // pulse | met | report | rate | again
  target_pair: string;
  value: number;
}

export function emptyState(): LiveState {
  return { status: "lobby", people: [], intros: {}, banned: [], dismissed: [], damage: {} };
}

export async function loadState(sid: string): Promise<LiveState> {
  const { data } = await db().from("live_sessions").select("state").eq("id", sid).maybeSingle();
  const s = data?.state as Partial<LiveState> | undefined;
  // Rows written by an older version of the app are treated as a fresh lobby.
  if (s && Array.isArray(s.people) && s.intros) return { ...emptyState(), ...s } as LiveState;
  const fresh = emptyState();
  await saveState(sid, fresh);
  return fresh;
}

export async function saveState(sid: string, state: LiveState) {
  await db().from("live_sessions").upsert({ id: sid, state, updated_at: new Date().toISOString() });
}

// Deterministic coin-flip so simulated members answer the same way on every poll.
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

async function loadDoc<T>(id: string, fallback: T): Promise<T> {
  const { data } = await db().from("live_sessions").select("state").eq("id", id).maybeSingle();
  return (data?.state as T | undefined) ?? fallback;
}
async function saveDoc(id: string, state: unknown) {
  await db().from("live_sessions").upsert({ id, state, updated_at: new Date().toISOString() });
}

/* ---------- Permanent bans (kept across parties) ---------- */

interface BanRecord { name: string; reason: string; at: string }
const BANS_ID = "bans";
const norm = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

// In production a ban is tied to the verified ID; in this MVP it is tied to the profile and the name.
export async function isBanned(name: string) {
  const first = norm(name).split(" ")[0];
  const { list } = await loadDoc<{ list: BanRecord[] }>(BANS_ID, { list: [] });
  return list.some((b) => norm(b.name) === norm(name) || norm(b.name) === first);
}

/* ---------- Conduct cases: removal tonight, then a moderator decides ---------- */

export interface BanOutcome {
  pass: boolean; // held a Season Pass
  refund: number; // dollars sent back
  fee: number; // conduct fee kept
}
export interface ConductCase {
  id: string;
  sid: string;
  kind: "guest" | "host";
  personId: string | null;
  profileId?: string;
  demo: boolean;
  name: string;
  by: "reports" | "host" | "guest";
  reasons: string[];
  reporters: number;
  appeal?: string;
  status: "open" | "banned" | "cleared";
  outcome?: BanOutcome;
  at: string;
}
const CASES_ID = "cases";
export async function loadCases(): Promise<ConductCase[]> {
  return (await loadDoc<{ list: ConductCase[] }>(CASES_ID, { list: [] })).list;
}
async function saveCases(list: ConductCase[]) {
  await saveDoc(CASES_ID, { list });
}
export async function clearCasesAndBans() {
  await db().from("live_sessions").delete().in("id", [CASES_ID, BANS_ID]);
}

// Take a guest out of tonight's party and hand the case to a moderator.
// Nothing permanent happens here: three guests could be wrong, and so could a host.
export async function removePerson(sid: string, state: LiveState, personId: string, by: "reports" | "host", reasons: string[], reporters: number) {
  const person = state.people.find((p) => p.id === personId);
  if (!person || state.banned.includes(personId)) return;
  state.banned.push(personId);
  await saveState(sid, state);
  const cases = await loadCases();
  cases.unshift({
    id: crypto.randomUUID(), sid, kind: "guest", personId, profileId: person.profileId, demo: person.demo, name: person.name,
    by, reasons, reporters, status: "open", at: new Date().toISOString(),
  });
  await saveCases(cases);
}

// A report about the host never goes to the host: it opens a case for Nestly directly.
export async function reportHost(sid: string, hostName: string, reason: string) {
  const cases = await loadCases();
  const open = cases.find((c) => c.sid === sid && c.kind === "host" && c.status === "open");
  if (open) {
    open.reporters += 1;
    if (!open.reasons.includes(reason)) open.reasons.push(reason);
  } else {
    cases.unshift({ id: crypto.randomUUID(), sid, kind: "host", personId: null, demo: true, name: hostName, by: "guest", reasons: [reason], reporters: 1, status: "open", at: new Date().toISOString() });
  }
  await saveCases(cases);
}

export async function addAppeal(sid: string, personId: string, text: string) {
  const cases = await loadCases();
  const c = cases.find((x) => x.sid === sid && x.personId === personId && x.status === "open");
  if (!c) return false;
  c.appeal = text.trim().slice(0, 600);
  await saveCases(cases);
  return true;
}

// The moderator's decision. "ban" is permanent: the profile is closed, the name is blocked, and a
// Season Pass is cancelled with a refund of the unused parties minus the conduct fee.
export async function decideCase(caseId: string, action: "ban" | "clear") {
  const cases = await loadCases();
  const c = cases.find((x) => x.id === caseId);
  if (!c || c.status !== "open") return null;
  if (action === "clear") c.status = "cleared";
  else {
    c.status = "banned";
    c.outcome = c.profileId ? await cancelMembership(c.profileId) : { pass: false, refund: 0, fee: 0 };
    if (c.kind === "guest" && !c.demo) {
      const bans = await loadDoc<{ list: BanRecord[] }>(BANS_ID, { list: [] });
      bans.list.push({ name: c.name, reason: c.reasons.join(", "), at: new Date().toISOString() });
      await saveDoc(BANS_ID, bans);
    }
  }
  await saveCases(cases);
  return c;
}

async function cancelMembership(profileId: string): Promise<BanOutcome> {
  const none = { pass: false, refund: 0, fee: 0 };
  const { data } = await db().from("applications").select("form,status,payment_intent_id").eq("id", profileId).eq("party_id", "profile").maybeSingle();
  if (!data) return none;
  const hadPass = !!data.form?.pass || data.status === "pass";
  await db().from("applications").update({ status: "banned", form: { ...data.form, pass: false } }).eq("id", profileId);
  if (!hadPass) return none;
  const { refund, fee } = passRefund(SEASON.passPrice, SEASON.weeks, SEASON.currentWeek);
  if (refund > 0 && data.payment_intent_id) {
    try {
      await stripe().refunds.create({ payment_intent: data.payment_intent_id, amount: refund * 100, metadata: { reason: "ban", conductFee: String(fee) } });
    } catch (e) {
      console.error("[ban] refund failed", e);
      return { pass: true, refund: 0, fee };
    }
  }
  return { pass: true, refund, fee };
}

/* ---------- Card holds: ticket + damage deposit ---------- */

type Booking = Pick<ApplicationRow, "id" | "form" | "status" | "payment_intent_id"> & { votes: BookingMeta | null };

async function bookingsFor(partyId: string): Promise<Booking[]> {
  const { data } = await db().from("applications").select("id,form,status,payment_intent_id,votes").eq("party_id", partyId).eq("status", "approved");
  return (data ?? []) as Booking[];
}

async function settle(b: Booking, damage: number, label: string) {
  if (!b.payment_intent_id || b.votes?.settled) return false;
  const pi = await stripe().paymentIntents.retrieve(b.payment_intent_id);
  if (pi.status !== "requires_capture") return false;
  const dollars = (b.votes?.price ?? 0) + damage;
  if (dollars > 0) await stripe().paymentIntents.capture(pi.id, { amount_to_capture: dollars * 100 });
  else await stripe().paymentIntents.cancel(pi.id);
  await db().from("applications").update({ votes: { ...(b.votes ?? {}), settled: label } }).eq("id", b.id);
  return true;
}

// The host reports damage by one guest. Up to the deposit comes from that guest's card hold;
// anything above it is covered by Nestly, so the host is made whole either way.
export async function claimDamage(sid: string, state: LiveState, personId: string, amount: number, note: string) {
  const person = state.people.find((p) => p.id === personId);
  if (!person) throw new Error("That guest is not in the room");
  if (state.damage[personId]) throw new Error("A claim for this guest has already been filed");
  const kept = Math.min(amount, DEPOSIT);
  let card = false;
  if (person.profileId) {
    const booking = (await bookingsFor(sid)).find((b) => b.form.profileId === person.profileId);
    if (booking) card = await settle(booking, kept, `Ticket charged and $${kept} kept from the deposit for damage`);
  }
  state.damage[personId] = { amount, note, kept: card ? kept : 0, covered: card ? amount - kept : amount, card };
  await saveState(sid, state);
}

// When the party ends: every remaining booking is charged its ticket (no-shows included)
// and the damage deposit is released.
export async function settleParty(sid: string) {
  let n = 0;
  for (const b of await bookingsFor(sid)) {
    try {
      if (await settle(b, 0, "Ticket charged, deposit released")) n++;
    } catch (e) {
      console.error("[settle]", b.id, e);
    }
  }
  return n;
}

// live_players.skill carries "pid:<profile id>|<about>" for guests who checked in with a profile.
export function packAbout(about: string | null, profileId?: string | null) {
  return profileId ? `pid:${profileId}|${about ?? ""}` : about;
}
export function unpackAbout(raw: string | null | undefined): { about?: string; profileId?: string } {
  if (!raw) return {};
  const m = /^pid:([0-9a-f-]{36})\|([\s\S]*)$/.exec(raw);
  return m ? { profileId: m[1], about: m[2] || undefined } : { about: raw };
}

/* ---------- Opening the room: who is here, and who should meet whom ---------- */

const SYSTEM = `You are the host's assistant at Nestly, an invite-only house-party club for adults 25-45.
The goal is friendship and a good night out, not dating. Your job is to give each
arriving guest three specific people to go and meet, with an honest reason and an easy opening question.
Use only what is written about each person. Never invent facts. Keep it warm, specific and short. Write in English.`;

export async function openRoom(sid: string, partyId: string) {
  const party = getParty(partyId);
  if (!party) throw new Error("Party not found");
  const prev = await loadState(sid);
  const { data: players } = await db().from("live_players").select("*").eq("session_id", sid).order("created_at");
  const real: Person[] = (players ?? []).map((p) => ({ id: p.id, name: p.name, gender: p.gender, demo: false, ...unpackAbout(p.skill) }));
  const members: Person[] = MEMBERS.map((m) => ({ id: m.id, name: m.name, gender: m.gender, demo: true, about: `${m.job}. ${m.bio} Into ${m.into.toLowerCase()}.` }));
  const people = [...real, ...members];
  const present = people.filter((p) => !prev.banned.includes(p.id));
  const guests = present.filter((p) => !p.demo);

  const intros: Record<string, Intro[]> = {};
  if (guests.length) {
    const prompt = `PARTY: "${party.title}" — ${party.theme}.

PEOPLE IN THE ROOM (id | name | gender | about):
${present.map((p) => `${p.id} | ${p.name} | ${p.gender} | ${p.about ?? "nothing shared yet"}`).join("\n")}

For each of these guests, choose exactly 3 OTHER people from the room they should meet tonight:
${guests.map((g) => `${g.id} (${g.name})`).join(", ")}

Return JSON:
{ "intros": [ { "guest": "guest id", "meet": [ { "id": "person id", "why": "one sentence on what they have in common", "icebreaker": "one question to open with" } ] } ] }
Pick people they would genuinely get on with as friends. Do not suggest the guest to themselves.`;
    const ai = await generateJson<{ intros: { guest: string; meet: Intro[] }[] }>(SYSTEM, prompt);
    const ids = new Set(present.map((p) => p.id));
    for (const row of ai.intros ?? []) {
      if (!guests.some((g) => g.id === row.guest)) continue;
      const seen = new Set<string>([row.guest]);
      intros[row.guest] = (row.meet ?? [])
        .filter((m) => m && ids.has(m.id) && !seen.has(m.id) && seen.add(m.id))
        .slice(0, 3)
        .map((m) => ({ id: m.id, why: String(m.why ?? ""), icebreaker: String(m.icebreaker ?? "") }));
    }
    if (!Object.values(intros).some((x) => x.length)) throw new Error("AI returned no introductions. Try again.");
  }

  const state: LiveState = { status: "running", people, intros, banned: prev.banned, dismissed: prev.dismissed, damage: prev.damage };
  await saveState(sid, state);
  return state;
}
