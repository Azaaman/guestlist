import { notFound } from "next/navigation";
import { dynamicPrice, genderCap, getParty, spotsLeft } from "@/lib/data";
import ApplyStart from "./ApplyStart";

export const dynamic = "force-dynamic";

export default async function ApplyPage({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = await params;
  const p = getParty(partyId);
  if (!p) notFound();
  const cap = genderCap(p);
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="font-semibold text-brand-2">{p.title}</p>
      <h1 className="mt-1 text-4xl">Book your place</h1>
      <ApplyStart partyId={p.id} price={dynamicPrice(p)} left={spotsLeft(p)} menLeft={Math.max(0, cap - p.men)} womenLeft={Math.max(0, cap - p.women)} />
    </div>
  );
}
