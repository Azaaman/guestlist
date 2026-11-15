import Link from "next/link";
import { notFound } from "next/navigation";
import { dynamicPrice, getHost, getParty, MEMBERS, spotsLeft } from "@/lib/data";
import { Avatar, Superhost, fmtDate } from "@/components/ui";
import PartyPhoto from "@/components/PartyPhoto";
import Countdown from "@/components/Countdown";

export default async function PartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParty(id);
  if (!p) notFound();
  const host = getHost(p.hostId)!;
  const going = MEMBERS.slice(0, 8);
  const price = dynamicPrice(p);
  const left = spotsLeft(p);
  return (
    <div className="glow">
      <div className="mx-auto max-w-3xl px-4 pb-28 pt-8">
        <Link href="/parties" className="text-sm font-semibold text-white/60 hover:text-white">Back to the line-up</Link>
        <p className="mt-6 font-semibold text-brand-2">{fmtDate(p.date)}, {p.neighborhood}</p>
        <h1 className="mt-2 text-5xl sm:text-6xl">{p.title}</h1>
        <Countdown to={p.date} className="mt-3 inline-block rounded-full bg-panel px-4 py-1.5 font-semibold text-hi" />
        <p className="mt-4 text-lg text-white/85">{p.theme}.</p>
        <PartyPhoto src={p.photo} alt={`Example of a venue like the one for ${p.title}`} className="mt-6 aspect-[16/9] w-full rounded-2xl" />
        <p className="mt-2 text-sm text-white/50">Example photo. The real house and its address are shown only to guests with a ticket.</p>

        <dl className="mt-8 grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center">
          <div><dt className="label">Price right now</dt><dd className="display price mt-1 text-3xl">${price}</dd><dd className="text-xs text-white/55">from ${p.basePriceUsd}, rises as it fills</dd></div>
          <div><dt className="label">Places left</dt><dd className={`display mt-1 text-3xl ${left <= 3 ? "text-hot" : ""}`}>{left === 0 ? "Full" : left}</dd><dd className="text-xs text-white/55">{left === 0 ? "waitlist open" : `of ${p.spots}`}</dd></div>
          <div><dt className="label">Address</dt><dd className="display mt-1 text-3xl">Hidden</dd><dd className="text-xs text-white/55">shown once you book</dd></div>
        </dl>

        <div className="mt-8 flex items-center gap-4 rounded-2xl bg-hi p-5 text-[#17103f]">
          <span className="shrink-0 text-3xl" aria-hidden>🤵👗</span>
          <div>
            <div className="text-sm font-bold">Dress code</div>
            <div className="display text-2xl">{p.dressCode}</div>
          </div>
        </div>

        <h2 className="reveal mt-12 text-2xl">The vibe</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.vibes.map((c) => <li key={c} className="rounded-full border border-line px-4 py-2 font-semibold">{c}</li>)}
        </ul>
        <p className="mt-3 text-sm text-white/60">When you check in, Nestly gives you three people to meet and a line to open with.</p>

        <h2 className="reveal mt-12 text-2xl">Your host</h2>
        <div className="mt-3 flex gap-4">
          <Avatar name={host.name} size={56} />
          <div>
            <div className="font-bold">{host.name}{host.superhost && <Superhost />}</div>
            <div className="text-sm text-white/65">Rated {host.rating} over {host.parties} parties</div>
            <p className="mt-1 text-white/75">{host.bio}</p>
            <p className="mt-1 text-sm text-white/55">ID and house checked by a Nestly moderator. Paid only after guests rate the night.</p>
          </div>
        </div>

        <h2 className="reveal mt-12 text-2xl">On the list so far</h2>
        <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
          {going.map((m) => (
            <li key={m.id} className="reveal flex items-center gap-3 border-t border-line py-3">
              <Avatar name={m.name} size={36} />
              <div className="min-w-0">
                <div className="font-semibold">{m.name}, {m.age} <span className="font-normal text-white/55">{m.job}</span></div>
                <div className="text-sm text-white/55">{m.badges.join(", ")}, rated {m.rating.toFixed(1)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <p className="hidden text-sm text-white/65 sm:block">{left === 0 ? "This party is full. Season Pass holders go to the front of the waitlist." : "Verified guests book in one tap. A Season Pass covers the ticket."}</p>
          <Link href={`/apply/${p.id}`} className="btn btn-primary w-full sm:w-auto">{left === 0 ? "Join the waitlist" : `Book a place, $${price}`}</Link>
        </div>
      </div>
    </div>
  );
}
