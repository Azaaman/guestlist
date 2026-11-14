import Link from "next/link";
import { notFound } from "next/navigation";
import { dynamicPrice, getHost, getParty, MEMBERS, spotsLeft } from "@/lib/data";
import { Avatar, fmtDate } from "@/components/ui";

export default async function PartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParty(id);
  if (!p) notFound();
  const host = getHost(p.hostId)!;
  const going = MEMBERS.slice(0, 8);
  const price = dynamicPrice(p);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/parties" className="text-sm text-white/60">← All parties</Link>
      <p className="label mt-6">Week {p.week} · {p.neighborhood}</p>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">{p.title}</h1>
      <p className="mt-2 text-white/70">{fmtDate(p.date)}</p>
      <p className="mt-4 text-lg text-white/85">{p.theme}.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><div className="label">Price now</div><div className="mt-1 text-2xl font-black">${price}</div><div className="text-xs text-white/55">base ${p.basePriceUsd} · rises as it fills</div></div>
        <div className="card p-4"><div className="label">Spots</div><div className="mt-1 text-2xl font-black">{spotsLeft(p)} left</div><div className="text-xs text-white/55">of {p.spots}</div></div>
        <div className="card p-4"><div className="label">Address</div><div className="mt-1 text-lg font-bold">🔒 Hidden</div><div className="text-xs text-white/55">revealed after approval</div></div>
      </div>

      <h2 className="mt-10 text-xl font-extrabold">Tonight&apos;s contests (as a couple)</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {p.contests.map((c) => <div key={c} className="card px-4 py-3 font-semibold">{c}</div>)}
      </div>

      <h2 className="mt-10 text-xl font-extrabold">Your host</h2>
      <div className="card mt-3 flex gap-4 p-4">
        <Avatar name={host.name} size={52} />
        <div>
          <div className="font-bold">{host.name} · ⭐ {host.rating} · {host.parties} parties {host.superhost && <span className="ml-1 rounded bg-gold/15 px-1.5 py-0.5 text-xs font-bold text-gold">Superhost</span>}</div>
          <p className="text-sm text-white/70">{host.bio}</p>
          <p className="mt-1 text-xs text-white/50">ID verified · venue inspected · paid only after guests rate the night</p>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-extrabold">Who&apos;s going</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {going.map((m) => (
          <div key={m.id} className="card flex items-center gap-2 px-3 py-2">
            <Avatar name={m.name} size={28} />
            <span className="text-sm">{m.name}, {m.age}</span>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 mt-10">
        <Link href={`/apply/${p.id}`} className="btn btn-primary w-full text-lg">Apply for a spot · ${price}</Link>
        <p className="mt-2 text-center text-xs text-white/55">Your card is only held. Not approved → you pay nothing.</p>
      </div>
    </div>
  );
}
