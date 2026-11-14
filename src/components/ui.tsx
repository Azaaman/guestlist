import Link from "next/link";
import PartyPhoto from "@/components/PartyPhoto";
import { dynamicPrice, getHost, spotsLeft, type Party } from "@/lib/data";

const TZ = "America/Chicago";

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

export function Avatar({ name, size = 40, tone = 0 }: { name: string; size?: number; tone?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hues = [250, 262, 276, 236, 292, 222];
  let h = 0;
  for (const ch of name) h = (h + ch.charCodeAt(0) + tone) % hues.length;
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-ink"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(140deg, hsl(${hues[h]} 70% 62%), hsl(${hues[(h + 2) % hues.length]} 62% 38%))` }}
    >
      {initials}
    </div>
  );
}

export function Superhost() {
  return <span className="ml-1.5 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">Superhost</span>;
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
        <p className="mt-1.5 text-white/70">{p.neighborhood}. The address unlocks once members approve you.</p>
        <p className="mt-2 text-sm text-white/55">{p.contests.join(", ")}</p>
        <p className="mt-2 text-sm text-white/70">Hosted by {host.name}, rated {host.rating}{host.superhost && <Superhost />}</p>
      </div>
      <div className="flex items-baseline gap-3 sm:block sm:text-right">
        <div className="display price text-3xl">${dynamicPrice(p)}</div>
        <div className={`text-sm ${left <= 3 ? "font-semibold text-hot" : "text-white/60"}`}>{left} of {p.spots} spots left</div>
      </div>
    </Link>
  );
}
