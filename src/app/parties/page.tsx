export const dynamic = "force-dynamic";

import { PARTIES } from "@/lib/data";
import { PartyCard } from "@/components/ui";

export default function Parties() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="label">Austin, TX</p>
      <h1 className="mt-2 text-3xl font-black">Parties this season</h1>
      <p className="mt-2 text-white/65">Prices rise as spots fill. Addresses unlock only after members approve you.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PARTIES.map((p) => <PartyCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
