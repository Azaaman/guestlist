export const dynamic = "force-dynamic";

import Link from "next/link";
import { PARTIES, SEASON } from "@/lib/data";
import { PartyCard } from "@/components/ui";

const steps = [
  { n: "01", t: "Pick a party", d: "Secret houses across Austin, every week. You see the vibe, not the address." },
  { n: "02", t: "Get approved", d: "Members vote on your application. Rejected? Your card hold is released — you pay $0." },
  { n: "03", t: "Get paired", d: "Tonight's pairs are formed by AI. You compete as a couple in quizzes, dance-offs, cook-offs." },
  { n: "04", t: "Win the season", d: "Points stack for 12 weeks. The Golden Couple wins a trip to Europe." },
];

export default function Home() {
  return (
    <div>
      <section className="glow">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-14 sm:pt-20">
          <p className="label">{SEASON.name} · Week {SEASON.currentWeek} of {SEASON.weeks}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] sm:text-6xl">
            Get on the list.<br />
            <span className="text-brand-2">Win the season.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            Invite-only house parties for adults 30–40. Guests approve guests. Couples compete. The best pair flies to Europe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/parties" className="btn btn-primary">Try as guest — no sign-up</Link>
            <Link href="/live/tonight" className="btn btn-ghost">Watch tonight&apos;s party live</Link>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {SEASON.prizes.map((p) => (
              <div key={p.place} className="card p-4">
                <div className={`text-sm font-black ${p.color === "gold" ? "text-gold" : p.color === "silver" ? "text-silver" : "text-bronze"}`}>
                  {p.place === 1 ? "🥇" : p.place === 2 ? "🥈" : "🥉"} {p.title}
                </div>
                <div className="mt-1 text-white/80">{p.prize}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-extrabold">How it works</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="card p-4">
              <div className="font-mono text-brand-2">{s.n}</div>
              <div className="mt-2 font-bold">{s.t}</div>
              <div className="mt-1 text-sm text-white/65">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold">Upcoming in Austin</h2>
          <Link href="/parties" className="text-sm text-brand-2">All parties →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PARTIES.slice(0, 4).map((p) => <PartyCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="card grid gap-6 p-6 sm:grid-cols-3">
          <div>
            <div className="label">Safety</div>
            <p className="mt-2 text-sm text-white/75">Every guest is screened, approved by members and rated after each party. Bans are tied to your ID, not your email.</p>
          </div>
          <div>
            <div className="label">Hosts</div>
            <p className="mt-2 text-sm text-white/75">Verified hosts run the venue. They&apos;re paid only after guests rate the night.</p>
          </div>
          <div>
            <div className="label">Season Pass</div>
            <p className="mt-2 text-sm text-white/75">${SEASON.passPrice.toLocaleString()} for 12 weeks: a seat at every party, priority approval, and a shot at the trips.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
