import { db } from "@/lib/db";
import { HOSTS, dynamicPrice, getParty } from "@/lib/data";
import { DEPOSIT, HOST_SHARE } from "@/lib/room";
import { Avatar, Superhost } from "@/components/ui";

export const dynamic = "force-dynamic";

const checks = [
  ["Before the first party", "ID check, photos and video of the venue, capacity check, then a trial night with a mystery guest."],
  ["The same core every night", "Hosts tick off a checklist: food and drinks per guest, music, first-aid kit, exit plan. Guest screening and introductions come from Nestly."],
  ["While the party runs", "QR check-in shows who arrived and when. Guests rate the night live and can report another guest. The host reviews each report on the spot and can remove the person. Reports about the host go straight to Nestly."],
  ["If something gets broken", `Every booking carries a $${DEPOSIT} deposit hold. The host files a claim on the night; up to the deposit comes from the guest, and Nestly's host protection covers the rest.`],
  ["Insurance and neighbours", "Nestly buys event liability cover for every party, since a normal home policy does not cover paid events. Guest numbers are capped, music stops at 11 pm and the pool closes then too."],
  ["After the party", "Guests rate the host. The payout stays in escrow for 24 to 48 hours and is released at 4.2 or higher. If a host cancels, guests are refunded in full and the host pays a fee. Repeated low ratings mean removal."],
];

// Real numbers from tonight's applications; the page still renders if the database is unreachable.
async function tonightStats() {
  try {
    const { data } = await db().from("applications").select("status").eq("party_id", "tonight");
    const rows = data ?? [];
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    return { total: rows.length, approved: count("approved"), waitlist: count("waitlist"), unpaid: count("reviewed") };
  } catch {
    return null;
  }
}

export default async function HostPage() {
  const stats = await tonightStats();
  const tonight = getParty("tonight")!;
  const price = dynamicPrice(tonight);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl sm:text-6xl">Hosts bring the house.<br />We bring the rest.</h1>
      <p className="mt-4 max-w-2xl text-white/70">Hosts keep {HOST_SHARE * 100}% of ticket revenue. Nestly handles the guests, screening, payments, introductions, insurance and safety.</p>

      <h2 className="mt-12 text-2xl">How a host is checked</h2>
      <ol className="mt-4 grid gap-x-8 sm:grid-cols-2">
        {checks.map(([t, d]) => (
          <li key={t} className="reveal border-t border-line py-4"><div className="text-lg font-bold">{t}</div><p className="mt-1 text-white/70">{d}</p></li>
        ))}
      </ol>

      <h2 className="mt-12 text-2xl">Tonight at {tonight.title}</h2>
      {stats ? (
        <dl className="mt-4 grid grid-cols-2 divide-line border-y border-line py-4 text-center sm:grid-cols-4 sm:divide-x">
          <div><dt className="label">Tickets booked on this site</dt><dd className="display mt-1 text-4xl text-mint">{stats.approved}</dd></div>
          <div><dt className="label">On the waitlist</dt><dd className="display mt-1 text-4xl">{stats.waitlist}</dd></div>
          <div><dt className="label">Waiting to pay</dt><dd className="display mt-1 text-4xl">{stats.unpaid}</dd></div>
          <div><dt className="label">Host share from these tickets</dt><dd className="display price mt-1 text-4xl">${Math.round(stats.approved * price * HOST_SHARE)}</dd></div>
        </dl>
      ) : (
        <p className="mt-4 text-white/60">Live numbers are unavailable right now. Reload to try again.</p>
      )}
      <p className="mt-2 text-sm text-white/50">These numbers come from real bookings made on this site.</p>

      <h2 className="mt-12 text-2xl">Host dashboards</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {HOSTS.map((h) => {
          const done = h.checklist.filter((c) => c.done).length;
          return (
            <div key={h.id} className="reveal card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={h.name} size={44} />
                <div>
                  <div className="font-bold">{h.name}{h.superhost && <Superhost />}</div>
                  <div className="text-sm text-white/65">Rated {h.rating} over {h.parties} parties</div>
                </div>
              </div>
              <div className="mt-4 font-semibold">Next party checklist, {done} of {h.checklist.length} done</div>
              <ul className="mt-2 space-y-1 text-sm">
                {h.checklist.map((c) => (
                  <li key={c.item} className="flex gap-2">
                    <span className={`w-12 shrink-0 font-bold ${c.done ? "text-mint" : "text-brand-2"}`}>{c.done ? "Done" : "To do"}</span>
                    <span className={c.done ? "text-white/75" : ""}>{c.item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 font-semibold">Payouts</div>
              <ul className="mt-2 space-y-1 text-sm">
                {h.payout.map((p) => (
                  <li key={p.party} className="flex justify-between gap-2">
                    <span className="text-white/75">{p.party.replace(" · ", ", ")}</span>
                    <span className={p.status === "held" ? "text-brand-2" : "text-mint"}>
                      ${p.amount}, {p.status === "held" ? "in escrow until ratings" : p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
