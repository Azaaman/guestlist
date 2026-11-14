import Link from "next/link";
import { SEASON, SEASON_PAIRS } from "@/lib/data";
import { Avatar } from "@/components/ui";

export default function Season() {
  const rows = SEASON_PAIRS.map((p) => ({ ...p, total: p.weeks.reduce((s, v) => s + v, 0) })).sort((a, b) => b.total - a.total);
  const weeks = rows[0].weeks.length;
  const max = rows[0].total;
  const colors = ["text-gold", "text-silver", "text-bronze"];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl sm:text-6xl">The race for Europe</h1>
      <p className="mt-3 max-w-xl text-white/70">
        {SEASON.name}. {weeks} of {SEASON.weeks} weeks played. Every party adds contest points, and the top three couples at the finale win the trips.
      </p>

      <ol className="mt-10">
        {rows.map((r, i) => (
          <li key={r.id} className="reveal grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 border-t border-line py-4">
            <div className={`display text-3xl ${colors[i] ?? "text-white/45"}`}>{i + 1}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2"><Avatar name={r.members[0]} size={32} /><Avatar name={r.members[1]} size={32} tone={3} /></div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold">{r.name}</div>
                  <div className="truncate text-sm text-white/60">{r.members.join(" and ")}</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-night">
                <div className="h-1.5 rounded-full" style={{ width: `${(r.total / max) * 100}%`, background: i === 0 ? "var(--color-gold)" : i === 1 ? "var(--color-silver)" : i === 2 ? "var(--color-bronze)" : "var(--color-line)" }} />
              </div>
              <div className="mt-1 text-sm text-white/50">By week: {r.weeks.join(", ")}</div>
              {i < 3 && <div className={`mt-1 text-sm font-semibold ${colors[i]}`}>On course for: {SEASON.prizes[i].prize}</div>}
            </div>
            <div className="display text-3xl sm:text-4xl">{r.total}</div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="max-w-lg text-white/65">Prizes are awarded for contest points earned as a couple. Skill decides the season, not luck.</p>
        <Link href="/pass" className="btn btn-primary w-full sm:w-auto">Join the race with a Season Pass</Link>
      </div>
    </div>
  );
}
