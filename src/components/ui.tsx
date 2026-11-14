import Link from "next/link";
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
  const hues = [345, 18, 38, 290, 320, 265, 200];
  let h = 0;
  for (const ch of name) h = (h + ch.charCodeAt(0) + tone) % hues.length;
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-ink"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(140deg, hsl(${hues[h]} 72% 58%), hsl(${hues[(h + 2) % hues.length]} 60% 36%))` }}
    >
      {initials}
    </div>
  );
}

export function Superhost() {
  return <span className="ml-1.5 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-bold text-gold">Superhost</span>;
}

// One line of the season line-up, set like a gig poster: date block, night, price.
export function PartyRow({ p }: { p: Party }) {
  const host = getHost(p.hostId)!;
  const left = spotsLeft(p);
  const d = dateParts(p.date);
  return (
    <Link href={`/parties/${p.id}`} className="group grid grid-cols-[4.5rem_1fr] gap-x-4 border-t border-line py-5 sm:grid-cols-[5.5rem_1fr_auto] sm:gap-x-6">
      <div className="text-center">
        <div className="text-sm font-semibold text-brand-2">{p.live ? "Tonight" : d.weekday}</div>
        <div className="display text-5xl sm:text-6xl">{d.day}</div>
        <div className="text-sm text-white/60">{d.month}, {d.time}</div>
      </div>
      <div className="min-w-0">
        <h3 className="display text-3xl group-hover:text-brand-2 sm:text-4xl">{p.title}</h3>
        <p className="mt-1.5 text-white/70">{p.neighborhood}. The address unlocks once members approve you.</p>
        <p className="mt-2 text-sm text-white/55">{p.contests.join(", ")}</p>
        <p className="mt-2 text-sm text-white/70">Hosted by {host.name}, rated {host.rating}{host.superhost && <Superhost />}</p>
      </div>
      <div className="col-start-2 mt-3 flex items-baseline gap-3 sm:col-start-3 sm:mt-0 sm:block sm:text-right">
        <div className="display text-4xl">${dynamicPrice(p)}</div>
        <div className={`text-sm ${left <= 3 ? "font-semibold text-brand" : "text-white/60"}`}>{left} of {p.spots} spots left</div>
        {p.live && <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"><span className="live-dot h-2 w-2 rounded-full bg-brand" />Live now</div>}
      </div>
    </Link>
  );
}
