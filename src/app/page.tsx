import Link from "next/link";
import { PARTIES, SEASON, dynamicPrice, spotsLeft } from "@/lib/data";
import { PartyRow } from "@/components/ui";
import Hook, { type HookParty } from "@/components/Hook";

export const dynamic = "force-dynamic";

const TZ = "America/New_York";
function when(iso: string, live?: boolean) {
  const d = new Date(iso);
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
  return live ? `Tonight, ${time}` : `${d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ })}, ${time}`;
}

const how = [
  { t: "Get verified once", d: "Create a profile. AI checks it in a few seconds. After that you never fill anything in again." },
  { t: "Book a night", d: "Pick any party with a free place. The fewer places left, the higher the price." },
  { t: "Meet the right people", d: "When you check in, AI gives you three people to meet and a line to open with. After the party, people who both want to meet again can stay in touch." },
  { t: "Everyone stays accountable", d: "You rate the host and can report a guest. Three reports, or one the host confirms, removes them; a moderator decides on a permanent ban." },
];

const tryIt = [
  { t: "Get verified and book", href: "/apply/tonight" },
  { t: "Open the big screen", href: "/live/tonight" },
  { t: "Join from a phone", href: "/play/tonight" },
];

export default function Home() {
  const hook: HookParty[] = PARTIES.map((p) => ({
    id: p.id, title: p.title, date: p.date, when: when(p.date, p.live), place: p.neighborhood, price: dynamicPrice(p), left: spotsLeft(p),
    photo: p.photo, venue: p.venue, dressCode: p.dressCode, vibes: p.vibes, live: !!p.live,
  }));
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
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="reveal">
            <h2 className="text-3xl sm:text-4xl">Season Pass</h2>
            <div className="display price mt-3 text-6xl">${SEASON.passPrice}</div>
            <p className="mt-3 text-white/80">A seat at all {SEASON.weeks} parties, about ${Math.round(SEASON.passPrice / SEASON.weeks)} a night. Pass holders go to the front of every waitlist and are entered to win a trip to Hawaii.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/pass" className="btn btn-primary">Get the Season Pass</Link>
              <Link href="/season" className="btn btn-ghost">How the prizes work</Link>
            </div>
          </div>
          <div className="reveal card p-6 text-center">
            <div className="text-5xl" aria-hidden>🌺</div>
            <div className="display price mt-3 text-5xl">{SEASON.prizeCount} winners</div>
            <div className="mt-2 text-lg">Each wins {SEASON.prize}</div>
            <p className="mt-2 text-sm text-white/65">Drawn among Season Pass holders at the finale. Every winner brings a friend.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="reveal flex items-end justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl">Coming up in Miami</h2>
          <Link href="/parties" className="shrink-0 font-semibold text-brand-2 hover:underline">All parties</Link>
        </div>
        <div className="mt-6 border-b border-line">
          {PARTIES.slice(0, 3).map((p) => <PartyRow key={p.id} p={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="reveal text-3xl sm:text-4xl">Walk through the demo</h2>
        <p className="reveal mt-2 text-white/75">Three steps show the whole product working, in about three minutes.</p>
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
