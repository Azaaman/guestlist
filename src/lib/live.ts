import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai";
import { getParty, MEMBERS, SEASON } from "@/lib/data";
import { stripe } from "@/lib/stripe";
import { passRefund } from "@/lib/room";

export interface Person {
  id: string;
  name: string;
  gender: "man" | "woman";
  demo: boolean; // simulated club member (fills the room for the demo)
  about?: string;
  profileId?: string; // set when the guest checked in with a saved profile or a ticket
}
export interface BanInfo {
  pass: boolean; // held a Season Pass
  refund: number; // dollars sent back
  fee: number; // conduct fee kept
}
export interface Intro {
  id: string;
  why: string;
  icebreaker: string;
}
export interface LiveState {
  status: "lobby" | "running" | "finished";
  people: Person[];
  intros: Record<string, Intro[]>; // guest id → the people they should meet tonight
  banned: string[]; // person ids removed tonight (and banned for good)
  dismissed: string[]; // person ids whose reports the host reviewed and dismissed
  banInfo: Record<string, BanInfo>; // what happened to a banned guest's Season Pass
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
  return { status: "lobby", people: [], intros: {}, banned: [], dismissed: [], banInfo: {} };
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

/* ---------- Permanent bans (kept across parties) ---------- */

interface BanRecord { name: string; reason: string; at: string }
const BANS_ID = "bans";
const norm = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

async function loadBans(): Promise<BanRecord[]> {
  const { data } = await db().from("live_sessions").select("state").eq("id", BANS_ID).maybeSingle();
  return ((data?.state as { list?: BanRecord[] } | undefined)?.list ?? []) as BanRecord[];
}

// In production a ban is tied to the verified ID; in this demo it is tied to the name.
export async function isBanned(name: string) {
  const first = norm(name).split(" ")[0];
  return (await loadBans()).some((b) => norm(b.name) === norm(name) || norm(b.name) === first);
}

export async function banPerson(sid: string, state: LiveState, personId: string, reason: string) {
  const person = state.people.find((p) => p.id === personId);
  if (!person || state.banned.includes(personId)) return;
  state.banned.push(personId);
  state.banInfo[personId] = await cancelMembership(person);
  await saveState(sid, state);
  if (!person.demo) {
    const list = await loadBans();
    list.push({ name: person.name, reason, at: new Date().toISOString() });
    await db().from("live_sessions").upsert({ id: BANS_ID, state: { list }, updated_at: new Date().toISOString() });
  }
}

// A banned guest's profile is closed. If they held a Season Pass, the unused parties are refunded
// through Stripe minus the conduct fee set out in the house rules.
async function cancelMembership(person: Person): Promise<BanInfo> {
  const none = { pass: false, refund: 0, fee: 0 };
  if (!person.profileId) return none;
  const { data } = await db().from("applications").select("form,status,payment_intent_id").eq("id", person.profileId).eq("party_id", "profile").maybeSingle();
  if (!data) return none;
  const hadPass = !!data.form?.pass || data.status === "pass";
  await db().from("applications").update({ status: "banned", form: { ...data.form, pass: false } }).eq("id", person.profileId);
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
There are no games or contests: the product simply brings screened people together. Your job is to give each
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
Mix men and women. Do not suggest the guest to themselves.`;
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

  const state: LiveState = { status: "running", people, intros, banned: prev.banned, dismissed: prev.dismissed, banInfo: prev.banInfo };
  await saveState(sid, state);
  return state;
}
