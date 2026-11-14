import Link from "next/link";
import { notFound } from "next/navigation";
import { dynamicPrice, getHost, getParty, MEMBERS, spotsLeft } from "@/lib/data";
import { Avatar, Superhost, fmtDate } from "@/components/ui";

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
        <h1 className="mt-2 text-6xl sm:text-7xl">{p.title}</h1>
        <p className="mt-4 text-lg text-white/85">{p.theme}.</p>

        <dl className="mt-8 grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center">
          <div><dt className="label">Price right now</dt><dd className="display mt-1 text-4xl">${price}</dd><dd className="text-xs text-white/55">from ${p.basePriceUsd}, rises as it fills</dd></div>
          <div><dt className="label">Spots left</dt><dd className={`display mt-1 text-4xl ${left <= 3 ? "text-brand" : ""}`}>{left}</dd><dd className="text-xs text-white/55">of {p.spots}</dd></div>
          <div><dt className="label">Address</dt><dd className="display mt-1 text-4xl">Hidden</dd><dd className="text-xs text-white/55">unlocks when you&apos;re approved</dd></div>
        </dl>

        <h2 className="mt-12 text-3xl">What you&apos;ll compete in, as a couple</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.contests.map((c) => <li key={c} className="rounded-full border border-line px-4 py-2 font-semibold">{c}</li>)}
        </ul>
        <p className="mt-3 text-sm text-white/60">AI pairs you with a partner at the door and writes tonight&apos;s program. Dress code: {p.dressCode.toLowerCase()}.</p>

        <h2 className="mt-12 text-3xl">Your host</h2>
        <div className="mt-3 flex gap-4">
          <Avatar name={host.name} size={56} />
          <div>
            <div className="font-bold">{host.name}{host.superhost && <Superhost />}</div>
            <div className="text-sm text-white/65">Rated {host.rating} over {host.parties} parties</div>
            <p className="mt-1 text-white/75">{host.bio}</p>
            <p className="mt-1 text-sm text-white/55">ID verified, venue inspected, paid only after guests rate the night.</p>
          </div>
        </div>

        <h2 className="mt-12 text-3xl">On the list so far</h2>
        <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
          {going.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-t border-line py-3">
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
          <p className="text-sm text-white/65">Your card is only held. Not approved means you pay nothing.</p>
          <Link href={`/apply/${p.id}`} className="btn btn-primary shrink-0">Apply for a spot, ${price}</Link>
        </div>
      </div>
    </div>
  );
}
