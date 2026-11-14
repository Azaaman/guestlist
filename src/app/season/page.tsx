import { SEASON, SEASON_PAIRS } from "@/lib/data";
import { Avatar } from "@/components/ui";

export default function Season() {
  const rows = SEASON_PAIRS.map((p) => ({ ...p, total: p.weeks.reduce((s, v) => s + v, 0) })).sort((a, b) => b.total - a.total);
  const weeks = rows[0].weeks.length;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="label">{SEASON.name}</p>
      <h1 className="mt-2 text-3xl font-black">The race for Europe</h1>
      <p className="mt-2 text-white/65">Week {SEASON.currentWeek} of {SEASON.weeks}. Points from every party stack up. Top 3 couples at the finale win the trips.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {SEASON.prizes.map((p, i) => (
          <div key={p.place} className={`card p-4 ${i === 0 ? "border-gold" : ""}`}>
            <div className={`font-black ${i === 0 ? "text-gold" : i === 1 ? "text-silver" : "text-bronze"}`}>{["🥇", "🥈", "🥉"][i]} {p.title}</div>
            <div className="mt-1 text-sm text-white/75">{p.prize}</div>
            <div className="mt-2 text-xs text-white/50">Currently: {rows[i].name}</div>
          </div>
        ))}
      </div>

      <div className="card mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-white/55">
            <tr className="border-b border-line">
              <th className="p-3">#</th><th className="p-3">Couple</th>
              {Array.from({ length: weeks }, (_, i) => <th key={i} className="p-3 text-right">W{i + 1}</th>)}
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-line/50 ${i < 3 ? "bg-white/[0.03]" : ""}`}>
                <td className="p-3 font-mono font-bold">{i + 1}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2"><Avatar name={r.members[0]} size={28} /><Avatar name={r.members[1]} size={28} tone={3} /></div>
                    <div><div className="font-bold">{r.name}</div><div className="text-xs text-white/55">{r.members.join(" & ")}</div></div>
                  </div>
                </td>
                {r.weeks.map((w, j) => <td key={j} className="p-3 text-right text-white/75">{w}</td>)}
                <td className="p-3 text-right text-lg font-black">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-white/55">Prizes are awarded for contest performance (skill), not chance. Season Pass holders get a seat at every party.</p>
    </div>
  );
}
