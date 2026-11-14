import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai";
import { getParty, MEMBERS } from "@/lib/data";

export interface Person {
  id: string;
  name: string;
  gender: "man" | "woman";
  demo: boolean; // simulated season member (fills the room for the demo)
  skill?: string;
}
export interface LivePair {
  id: string;
  name: string;
  a: Person;
  b: Person;
  why: string;
}
export interface Question {
  q: string;
  options: string[];
  answer: number;
}
export interface Contest {
  type: "quiz" | "vote";
  title: string;
  description: string;
  emoji: string;
  questions?: Question[];
}
export interface LiveState {
  status: "lobby" | "running" | "finished";
  pairs: LivePair[];
  program: Contest[];
  current: number;
  qIndex: number;
  phase: "open" | "reveal";
}

export const QUIZ_POINTS = 10;
export const VOTE_MULTIPLIER = 4; // avg vote (1-5) × 4 → max 20 per judged contest

export function emptyState(): LiveState {
  return { status: "lobby", pairs: [], program: [], current: -1, qIndex: 0, phase: "open" };
}

export async function loadState(sid: string): Promise<LiveState> {
  const { data } = await db().from("live_sessions").select("state").eq("id", sid).maybeSingle();
  if (data?.state) return data.state as LiveState;
  const s = emptyState();
  await db().from("live_sessions").upsert({ id: sid, state: s });
  return s;
}

export async function saveState(sid: string, state: LiveState) {
  await db().from("live_sessions").upsert({ id: sid, state, updated_at: new Date().toISOString() });
}

// Deterministic pseudo-random for simulated members (so scores don't jump between polls).
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export interface ActionRow {
  player_id: string;
  contest_index: number;
  question_index: number;
  kind: string; // answer | vote | pulse | report | rate | again
  target_pair: string;
  value: number;
}

export function computeScores(state: LiveState, actions: ActionRow[]) {
  const totals: Record<string, number> = {};
  const perContest: Record<string, number[]> = {};
  state.pairs.forEach((p) => {
    totals[p.id] = 0;
    perContest[p.id] = state.program.map(() => 0);
  });

  state.program.forEach((c, ci) => {
    // Only score contests that have started; for the current one only revealed questions count.
    if (state.status === "lobby" || ci > state.current) return;
    if (c.type === "quiz" && c.questions) {
      c.questions.forEach((q, qi) => {
        const counted = ci < state.current || state.status === "finished" || qi < state.qIndex || (qi === state.qIndex && state.phase === "reveal");
        if (!counted) return;
        for (const p of state.pairs) {
          for (const person of [p.a, p.b]) {
            let correct = false;
            if (person.demo) correct = hash(`${person.id}:${ci}:${qi}`) < 0.55;
            else {
              const a = actions.find((x) => x.kind === "answer" && x.player_id === person.id && x.contest_index === ci && x.question_index === qi);
              correct = !!a && a.value === q.answer;
            }
            if (correct) perContest[p.id][ci] += QUIZ_POINTS;
          }
        }
      });
    } else if (c.type === "vote") {
      const counted = ci < state.current || state.status === "finished" || state.phase === "reveal";
      if (!counted) return;
      for (const p of state.pairs) {
        const votes = actions.filter((x) => x.kind === "vote" && x.contest_index === ci && x.target_pair === p.id).map((x) => x.value);
        // simulated members in the room also cast 2 votes per pair
        votes.push(1 + Math.floor(hash(`v1:${p.id}:${ci}`) * 5), 1 + Math.floor(hash(`v2:${p.id}:${ci}`) * 5));
        const avg = votes.reduce((s, v) => s + v, 0) / votes.length;
        perContest[p.id][ci] += Math.round(avg * VOTE_MULTIPLIER);
      }
    }
  });
  for (const id of Object.keys(perContest)) totals[id] = perContest[id].reduce((s, v) => s + v, 0);
  return { totals, perContest };
}

const SETUP_SYSTEM = `You are the party engine of Guestlist, an invite-only party club where couples compete in contests.
You form pairs for tonight and design the contest program. Pairs should be man+woman where possible,
balance contest skills, and each real (non-demo) guest should be paired thoughtfully. Contests are always
done as a pair, never individual strength contests. Quiz facts must be accurate. Write in English.`;

export async function setupParty(sid: string, partyId: string) {
  const party = getParty(partyId);
  if (!party) throw new Error("Party not found");
  const { data: players } = await db().from("live_players").select("*").eq("session_id", sid).order("created_at");
  const real: Person[] = (players ?? []).map((p) => ({ id: p.id, name: p.name, gender: p.gender, demo: false, skill: p.skill }));

  // Fill the room with season members so there are at least 4 balanced pairs.
  const men = real.filter((p) => p.gender === "man").length;
  const women = real.filter((p) => p.gender === "woman").length;
  const targetEach = Math.max(4, men, women);
  const demoMen = MEMBERS.filter((m) => m.gender === "man").slice(0, Math.max(0, targetEach - men));
  const demoWomen = MEMBERS.filter((m) => m.gender === "woman").slice(0, Math.max(0, targetEach - women));
  const pool: Person[] = [
    ...real,
    ...[...demoMen, ...demoWomen].map((m) => ({ id: m.id, name: m.name, gender: m.gender, demo: true, skill: m.skill })),
  ];

  const prompt = `PARTY: "${party.title}" — ${party.theme}. Planned contests: ${party.contests.join(", ")}.

GUESTS (id | name | gender | best skill | real or simulated):
${pool.map((p) => `${p.id} | ${p.name} | ${p.gender} | ${p.skill ?? "unknown"} | ${p.demo ? "simulated" : "REAL"}`).join("\n")}

Return JSON:
{
  "pairs": [ { "a": "guest id", "b": "guest id", "name": "fun 2-3 word team name", "why": "one sentence why they match" } ],
  "program": [
    { "type": "quiz", "title": "American History Quiz", "emoji": "🇺🇸", "description": "one line", "questions": [ { "q": "...", "options": ["A","B","C","D"], "answer": 0 } ] },
    { "type": "vote", "title": "...", "emoji": "...", "description": "what the pair must do in 3 minutes; guests rate 1-5" },
    { "type": "quiz", "title": "Logic Battle", "emoji": "🧩", "description": "one line", "questions": [ ... ] },
    { "type": "vote", "title": "...", "emoji": "...", "description": "..." }
  ]
}
Rules: every guest appears in exactly one pair (${pool.length} guests → ${Math.floor(pool.length / 2)} pairs).
American History Quiz: exactly 4 questions, medium difficulty, 4 options each, "answer" is the 0-based index of the correct option.
Logic Battle: exactly 3 short riddles/logic puzzles with 4 options each.
Vote contests must match the party theme (e.g. dance-off, cooking duel, paint together).`;

  const ai = await generateJson<{ pairs: { a: string; b: string; name: string; why: string }[]; program: Contest[] }>(
    SETUP_SYSTEM,
    prompt,
  );

  // Validate AI pairs; anyone left out gets paired in order so nobody is stranded.
  const byId = new Map(pool.map((p) => [p.id, p]));
  const used = new Set<string>();
  const pairs: LivePair[] = [];
  for (const p of ai.pairs ?? []) {
    const a = byId.get(p.a);
    const b = byId.get(p.b);
    if (!a || !b || a.id === b.id || used.has(a.id) || used.has(b.id)) continue;
    used.add(a.id);
    used.add(b.id);
    pairs.push({ id: `pair${pairs.length + 1}`, a, b, name: p.name || `Team ${pairs.length + 1}`, why: p.why || "" });
  }
  const left = pool.filter((p) => !used.has(p.id));
  while (left.length >= 2) {
    const a = left.shift()!;
    const idx = left.findIndex((x) => x.gender !== a.gender);
    const b = left.splice(idx >= 0 ? idx : 0, 1)[0];
    pairs.push({ id: `pair${pairs.length + 1}`, a, b, name: `Team ${pairs.length + 1}`, why: "Paired to keep the teams even." });
  }

  const program = (ai.program ?? [])
    .filter((c) => c && (c.type === "vote" || (c.type === "quiz" && Array.isArray(c.questions) && c.questions.length)))
    .map((c) => ({
      ...c,
      questions: c.type === "quiz"
        ? c.questions!.filter((q) => Array.isArray(q.options) && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length)
        : undefined,
    }));
  if (!program.length) throw new Error("AI returned no contests");

  const state: LiveState = { status: "running", pairs, program, current: 0, qIndex: 0, phase: "open" };
  await saveState(sid, state);
  return state;
}
