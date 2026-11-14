import Link from "next/link";
import { PARTIES, SEASON, SEASON_PAIRS, dynamicPrice, spotsLeft } from "@/lib/data";
import { Avatar, PartyRow } from "@/components/ui";
import Hook, { type HookParty } from "@/components/Hook";

export const dynamic = "force-dynamic";

const TZ = "America/Chicago";
function when(iso: string, live?: boolean) {
  const d = new Date(iso);
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
  return live ? `Tonight, ${time}` : `${d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ })}, ${time}`;
}

const how = [
  { t: "Pick a night", d: "A different house in Austin every week. You see the theme and the contests, not the address." },
  { t: "Members vote you in", d: "They read your application. Your card is only held, and a no costs you nothing." },
  { t: "AI pairs you up", d: "At the door you get a partner. You compete as a couple in quizzes, dance-offs and cook-offs." },
  { t: "Win the season", d: "Points add up over twelve weeks. The top three couples win trips." },
];

const tryIt = [
  { t: "Apply as a guest", href: "/apply/tonight" },
  { t: "Open the big screen", href: "/live/tonight" },
  { t: "Join from a phone", href: "/play/tonight" },
];

export default function Home() {
  const hook: HookParty[] = PARTIES.map((p) => ({
    id: p.id, title: p.title, when: when(p.date, p.live), place: p.neighborhood, price: dynamicPrice(p), left: spotsLeft(p),
    photo: p.photo, venue: p.venue, contests: p.contests, live: !!p.live,
  }));
  const board = SEASON_PAIRS.map((p) => ({ ...p, total: p.weeks.reduce((a, b) => a + b, 0) })).sort((a, b) => b.total - a.total).slice(0, 5);
  const medal = ["text-gold", "text-silver", "text-bronze"];
  return (
    <div>
      <Hook parties={hook} />

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="reveal text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-6 grid gap-x-10 sm:grid-cols-2">
          {how.map((h, i) => (
            <li key={h.t} className="reveal flex gap-4 border-t border-line py-5">
              <span className="display text-3xl text-brand-2">{i + 1}</span>
              <div>
                <div className="text-lg font-semibold">{h.t}</div>
                <p className="mt-1 text-white/75">{h.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-night">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="reveal flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl sm:text-4xl">Season leaderboard</h2>
              <p className="mt-2 text-white/75">Week {SEASON.currentWeek} of {SEASON.weeks}. The top three couples win the trips.</p>
            </div>
            <Link href="/season" className="font-semibold text-brand-2 hover:underline">Full standings</Link>
          </div>
          <ol className="mt-6">
            {board.map((r, i) => (
              <li key={r.id} className="reveal flex items-center gap-3 border-t border-line py-3 sm:gap-4">
                <span className={`display w-7 text-center text-2xl ${medal[i] ?? "text-white/50"}`}>{i + 1}</span>
                <div className="flex -space-x-2"><Avatar name={r.members[0]} size={34} /><Avatar name={r.members[1]} size={34} /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{r.name}</div>
                  <div className="truncate text-sm text-white/65">{r.members.join(" and ")}</div>
                </div>
                {i < 3 && <span className={`hidden rounded-full bg-white/10 px-3 py-1 text-sm font-semibold sm:inline ${medal[i]}`}>{SEASON.prizes[i].prize}</span>}
                <span className="display price w-16 text-right text-2xl">{r.total}</span>
              </li>
            ))}
          </ol>
          <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/pass" className="btn btn-primary">Join with a Season Pass, ${SEASON.passPrice}</Link>
            <span className="text-sm text-white/65">All {SEASON.weeks} parties, about ${Math.round(SEASON.passPrice / SEASON.weeks)} a night.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="reveal flex items-end justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl">Coming up in Austin</h2>
          <Link href="/parties" className="shrink-0 font-semibold text-brand-2 hover:underline">All parties</Link>
        </div>
        <div className="mt-6 border-b border-line">
          {PARTIES.slice(0, 3).map((p) => <PartyRow key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="reveal text-3xl sm:text-4xl">Try it in three minutes</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {tryIt.map((s, i) => (
            <li key={s.t} className="reveal" style={{ transitionDelay: `${i * 90}ms` }}>
              <Link href={s.href} className="btn btn-ghost w-full justify-start gap-3 py-4 text-left text-lg">
                <span className="display text-2xl text-brand-2">{i + 1}</span>{s.t}
              </Link>
            </li>
          ))}
        </ol>
        <p className="reveal mt-3 text-sm text-white/60">No sign-up. Payments run on a Stripe test card.</p>
      </section>
    </div>
  );
}
