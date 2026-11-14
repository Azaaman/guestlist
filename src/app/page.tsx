import Link from "next/link";
import { PARTIES, SEASON, dynamicPrice, spotsLeft } from "@/lib/data";
import { PartyRow } from "@/components/ui";
import Hook, { type HookParty } from "@/components/Hook";

export const dynamic = "force-dynamic";

const TZ = "America/Chicago";
function when(iso: string, live?: boolean) {
  const d = new Date(iso);
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
  return live ? `Tonight, ${time}` : `${d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ })}, ${time}`;
}

const dot = "inline-block h-7 w-7 rounded-full";
const how = [
  { t: "Pick a night", art: <div className="a-pick flex items-end gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="block h-10 w-7 rounded-md bg-white/25" />)}</div> },
  { t: "Members vote you in", art: <div className="a-vote flex gap-1.5">{[0, 1, 2].map((i) => <i key={i} className={`${dot} flex items-center justify-center bg-mint text-sm font-bold not-italic text-[#17103f]`}>✓</i>)}</div> },
  { t: "AI pairs you up", art: <div className="a-pair flex"><i className={`${dot} bg-white`} /><i className={`${dot} bg-hi`} /></div> },
  { t: "Win the trip", art: <div className="a-fly text-3xl"><span aria-hidden>✈️</span></div> },
];

const prizes = ["✈️", "🌺", "🏕️"];

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
  return (
    <div>
      <Hook parties={hook} />

      <section className="mx-auto max-w-5xl px-4 py-14">
        <ol className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {how.map((s, i) => (
            <li key={s.t} className="reveal card flex flex-col items-center gap-4 px-3 py-6 text-center" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="flex h-14 items-center justify-center">{s.art}</div>
              <div className="font-semibold"><span className="text-brand-2">{i + 1}.</span> {s.t}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-night">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center">
          <h2 className="reveal text-3xl sm:text-5xl">Three couples win a trip.</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {SEASON.prizes.map((p, i) => (
              <li key={p.place} style={{ transitionDelay: `${i * 110}ms` }} className="reveal card px-4 py-6">
                <div className="text-4xl" aria-hidden>{prizes[i]}</div>
                <div className={`display mt-3 text-2xl ${p.color === "gold" ? "text-gold" : p.color === "silver" ? "text-silver" : "text-bronze"}`}>{p.title}</div>
                <div className="mt-1 text-white/85">{p.prize}</div>
              </li>
            ))}
          </ul>
          <div className="reveal mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/season" className="btn btn-ghost">See the standings</Link>
            <Link href="/pass" className="btn btn-primary">Season Pass, ${SEASON.passPrice.toLocaleString()}</Link>
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
