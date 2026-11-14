import { HOSTS } from "@/lib/data";
import { Avatar } from "@/components/ui";

const rules = [
  ["Before the first party", "ID verification, venue photos/video and capacity check, trial night with a mystery guest."],
  ["Standard", "Checklist: food & drinks per guest, music, space for contests, first-aid kit, exit plan. The contest program comes from Guestlist AI, so every party has the same core."],
  ["During", "QR check-in shows who arrived and when. Party Mode shows contests are running. Guests can hit “Problem” at any time."],
  ["After", "Guests rate the host. Payout is held in escrow for 24–48h. Bad ratings or complaints → guests refunded, host not paid. Below 4.2 → warning, then removal."],
];

export default function HostPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="label">For hosts</p>
      <h1 className="mt-2 text-3xl font-black">Hosts bring the house. We bring everything else.</h1>
      <p className="mt-2 max-w-2xl text-white/65">Hosts earn 70% of ticket revenue (75% for Superhosts). Guestlist handles guests, screening, payments, pairing and the contest program.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {rules.map(([t, d]) => (
          <div key={t} className="card p-4"><div className="font-bold">{t}</div><p className="mt-1 text-sm text-white/70">{d}</p></div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-extrabold">Host dashboard</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {HOSTS.map((h) => {
          const done = h.checklist.filter((c) => c.done).length;
          return (
            <div key={h.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={h.name} size={44} />
                <div>
                  <div className="font-bold">{h.name}</div>
                  <div className="text-sm text-white/65">⭐ {h.rating} · {h.parties} parties {h.superhost && <span className="ml-1 rounded bg-gold/15 px-1.5 py-0.5 text-xs font-bold text-gold">Superhost</span>}</div>
                </div>
              </div>
              <div className="mt-4 label">Party checklist · {done}/{h.checklist.length}</div>
              <div className="mt-2 space-y-1 text-sm">
                {h.checklist.map((c) => <div key={c.item} className={c.done ? "" : "text-gold"}>{c.done ? "✅" : "⚠️"} {c.item}</div>)}
              </div>
              <div className="mt-4 label">Payouts</div>
              <div className="mt-2 space-y-1 text-sm">
                {h.payout.map((p) => (
                  <div key={p.party} className="flex justify-between gap-2">
                    <span className="text-white/75">{p.party}</span>
                    <span className={p.status === "held" ? "text-gold" : p.status === "released" ? "text-brand-2" : "text-mint"}>
                      ${p.amount} · {p.status === "held" ? "in escrow until reviews" : p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
