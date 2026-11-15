import Link from "next/link";
import PartyPhoto from "@/components/PartyPhoto";
import { dynamicPrice, getHost, spotsLeft, type Party } from "@/lib/data";

const TZ = "America/New_York";

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ });
}
function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleString("en-US", { day: "numeric", timeZone: TZ }),
    month: d.toLocaleString("en-US", { month: "short", timeZone: TZ }),
    weekday: d.toLocaleString("en-US", { weekday: "short", timeZone: TZ }),
    time: d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }),
  };
}

export function Avatar({ name, size = 40 }: { name: string; size?: number; tone?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-paper font-bold text-[#4a33c9] ring-2 ring-ink"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export function Superhost() {
  return <span className="ml-1.5 rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold text-gold">Superhost</span>;
}

// One night in the season line-up: example photo, date, the night itself, price.
export function PartyRow({ p }: { p: Party }) {
  const host = getHost(p.hostId)!;
  const left = spotsLeft(p);
  const d = dateParts(p.date);
  return (
    <Link href={`/parties/${p.id}`} className="reveal group grid gap-4 border-t border-line py-5 sm:grid-cols-[13rem_1fr_auto] sm:gap-6">
      <PartyPhoto src={p.photo} alt={`Example of a venue like the one for ${p.title}`} className="aspect-[16/10] w-full rounded-xl sm:aspect-[4/3]" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-brand-2">
          <span>{p.live ? "Tonight" : `${d.weekday}, ${d.month} ${d.day}`} at {d.time}</span>
          {p.live && <span className="inline-flex items-center gap-1.5 text-hot"><span className="live-dot h-2 w-2 rounded-full bg-hot" />Live now</span>}
        </div>
        <h3 className="display mt-1 text-2xl group-hover:text-brand-2 sm:text-3xl">{p.title}</h3>
        <p className="mt-1 text-white/75">{p.neighborhood}, host rated {host.rating}{host.superhost && <Superhost />}</p>
        <p className="mt-2 inline-block rounded-full bg-hi px-3 py-1 text-sm font-bold text-[#17103f]"><span aria-hidden>🤵👗 </span>Dress code: {p.dressCode}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {p.vibes.map((c) => <li key={c} className="rounded-full bg-white/12 px-3 py-1 text-sm font-medium">{c}</li>)}
        </ul>
      </div>
      <div className="flex items-baseline gap-3 sm:block sm:text-right">
        <div className="display price text-3xl">${dynamicPrice(p)}</div>
        <div className={`text-sm ${left <= 3 ? "font-semibold text-hot" : "text-white/60"}`}>{left === 0 ? "Full, waitlist open" : `${left} of ${p.spots} spots left`}</div>
      </div>
    </Link>
  );
}
