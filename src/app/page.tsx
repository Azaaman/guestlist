import Link from "next/link";
import { MEMBERS, PARTIES, SEASON, getParty, spotsLeft } from "@/lib/data";
import { PartyRow } from "@/components/ui";

export const dynamic = "force-dynamic";

const how = [
  { t: "Pick a night", d: "A different house in Austin every week. You see the theme and the contests, never the address." },
  { t: "Get approved", d: "Members read your application and vote. Your card is only held. If they say no, you pay nothing." },
  { t: "Get paired", d: "At the door, AI pairs you with a partner. You compete as a couple: quizzes, dance-offs, cook-offs." },
  { t: "Win the season", d: "Points add up over twelve weeks. The Golden Couple flies to Europe." },
];

const jury = [
  { t: "Apply as a guest", d: "Use the sample guest. AI writes your profile, members vote, a Stripe test card is held and the address unlocks.", href: "/apply/tonight", cta: "Apply to tonight's party" },
  { t: "Open the big screen", d: "This is what the room sees at the party. Put it on a laptop or projector.", href: "/live/tonight", cta: "Open the big screen" },
  { t: "Join from your phone", d: "Scan the code on the big screen. You get a partner, answer the quiz and judge the dance-off live.", href: "/play/tonight", cta: "Join on this device" },
];

export default function Home() {
  const tonight = getParty("tonight")!;
  const list = MEMBERS.slice(0, 7);
  return (
    <div>
      <section className="glow">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-16 pt-12 md:grid-cols-[1.15fr_1fr] md:items-center md:pt-20">
          <div>
            <h1 className="text-7xl sm:text-8xl md:text-[7.5rem]">Get on<br />the list.</h1>
            <p className="mt-6 max-w-md text-lg text-white/80">
              Secret house parties for adults in their thirties. Members decide who gets in. Couples compete all season, and the best pair flies to Europe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/parties" className="btn btn-primary">See this season&apos;s parties</Link>
              <Link href="/live/tonight" className="btn btn-ghost">Watch tonight live</Link>
            </div>
            <p className="mt-4 text-sm text-white/55">No sign-up needed to try it.</p>
          </div>

          {/* The door list: the thing everyone wants to be on. */}
          <div className="paper mx-auto w-full max-w-sm rotate-1 p-6">
            <div className="flex items-baseline justify-between">
              <div className="display text-3xl">Door list</div>
              <div className="text-sm font-semibold">Tonight, 9 pm</div>
            </div>
            <div className="mt-1 text-sm text-paper-ink/70">{tonight.title}, {tonight.neighborhood}</div>
            <ul className="mt-4">
              {list.map((m) => (
                <li key={m.id} className="rule flex items-center justify-between py-2">
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-sm text-paper-ink/60">approved <span className="font-bold text-[#1f8a5b]">✓</span></span>
                </li>
              ))}
              <li className="rule flex items-center justify-between py-2">
                <span className="font-semibold text-paper-ink/45">Your name</span>
                <span className="text-sm font-semibold text-brand">{spotsLeft(tonight)} spots left</span>
              </li>
            </ul>
            <Link href="/apply/tonight" className="btn btn-paper mt-4 w-full">Apply for tonight</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-4xl sm:text-5xl">How a season works</h2>
        <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {how.map((s, i) => (
            <li key={s.t} className="border-t-2 border-brand pt-4">
              <div className="display text-5xl text-brand-2">{i + 1}</div>
              <div className="mt-2 text-lg font-bold">{s.t}</div>
              <p className="mt-1 text-white/70">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-night">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl">Three couples.<br />Three trips.</h2>
            <p className="mt-4 text-white/70">Prizes go to the couples with the most contest points after {SEASON.weeks} weeks. Skill decides it, not luck.</p>
            <Link href="/season" className="btn btn-ghost mt-6">See the standings</Link>
          </div>
          <ul>
            {SEASON.prizes.map((p) => (
              <li key={p.place} className="flex items-baseline gap-4 border-t border-line py-4 last:border-b">
                <span className={`display w-44 shrink-0 text-3xl ${p.color === "gold" ? "text-gold" : p.color === "silver" ? "text-silver" : "text-bronze"}`}>{p.title}</span>
                <span className="text-lg text-white/85">{p.prize}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-4xl sm:text-5xl">Coming up in Austin</h2>
          <Link href="/parties" className="shrink-0 font-semibold text-brand-2 hover:underline">All parties</Link>
        </div>
        <div className="mt-6 border-b border-line">
          {PARTIES.slice(0, 3).map((p) => <PartyRow key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-4xl sm:text-5xl">Try the whole thing in three minutes</h2>
        <p className="mt-3 max-w-xl text-white/70">Everything below runs for real: the AI screening, the card hold, the pairing and the live scoring.</p>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {jury.map((s, i) => (
            <li key={s.t} className="card flex flex-col p-5">
              <div className="display text-4xl text-brand-2">{i + 1}</div>
              <div className="mt-1 text-lg font-bold">{s.t}</div>
              <p className="mt-1 flex-1 text-white/70">{s.d}</p>
              <Link href={s.href} className="btn btn-ghost mt-4">{s.cta}</Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-8 border-t border-line pt-10 sm:grid-cols-3">
          <div>
            <div className="text-lg font-bold">Everyone is screened</div>
            <p className="mt-1 text-white/70">Guests are checked before the party, approved by members and rated after it. A ban follows your ID, not your email.</p>
          </div>
          <div>
            <div className="text-lg font-bold">Hosts earn their payout</div>
            <p className="mt-1 text-white/70">Verified hosts provide the house. Their money stays in escrow until guests rate the night.</p>
          </div>
          <div>
            <div className="text-lg font-bold">Season Pass, ${SEASON.passPrice.toLocaleString()}</div>
            <p className="mt-1 text-white/70">A seat at all {SEASON.weeks} parties, priority approval and your place in the race for the trips. <Link href="/pass" className="font-semibold text-brand-2 hover:underline">Get the pass</Link></p>
          </div>
        </div>
      </section>
    </div>
  );
}
