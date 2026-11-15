// Page: the season's line-up of parties.
import { PARTIES, SEASON } from "@/lib/data";
import { PartyRow } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function Parties() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl sm:text-6xl">The line-up</h1>
      <p className="mt-3 max-w-xl text-white/70">
        {SEASON.name}, week {SEASON.currentWeek} of {SEASON.weeks}. One party a week, a new house every time.
        Prices rise as a night fills up.
      </p>
      <div className="mt-8 border-b border-line">
        {PARTIES.map((p) => (
          <PartyRow key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
