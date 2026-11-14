import Link from "next/link";
import { dynamicPrice, getHost, spotsLeft, type Party } from "@/lib/data";

export function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
}

export function Avatar({ name, size = 40, tone = 0 }: { name: string; size?: number; tone?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hues = [258, 280, 320, 200, 170, 30, 345, 230];
  let h = 0;
  for (const ch of name) h = (h + ch.charCodeAt(0) + tone) % hues.length;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${hues[h]} 70% 55%), hsl(${hues[(h + 3) % hues.length]} 70% 40%))` }}
    >
      {initials}
    </div>
  );
}

export function PartyCard({ p }: { p: Party }) {
  const host = getHost(p.hostId)!;
  const left = spotsLeft(p);
  return (
    <Link href={`/parties/${p.id}`} className="card group block p-5 transition hover:border-brand">
      <div className="flex items-center justify-between">
        <span className="label">Week {p.week} · {p.neighborhood}</span>
        {p.live && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-400" /> TONIGHT
          </span>
        )}
      </div>
      <h3 className="mt-2 text-xl font-extrabold group-hover:text-brand-2">{p.title}</h3>
      <p className="mt-1 text-sm text-white/65">{fmtDate(p.date)} · Address revealed after approval</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.contests.map((c) => (
          <span key={c} className="rounded-md bg-night px-2 py-0.5 text-xs text-white/75">{c}</span>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="text-sm text-white/70">
          Host {host.name} · ⭐ {host.rating}
          {host.superhost && <span className="ml-1.5 rounded bg-gold/15 px-1.5 py-0.5 text-xs font-bold text-gold">Superhost</span>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold">${dynamicPrice(p)}</div>
          <div className={`text-xs ${left <= 3 ? "text-red-300" : "text-white/60"}`}>{left} of {p.spots} spots left</div>
        </div>
      </div>
    </Link>
  );
}
