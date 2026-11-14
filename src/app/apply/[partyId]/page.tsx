import { notFound } from "next/navigation";
import { dynamicPrice, getParty } from "@/lib/data";
import ApplyStart from "./ApplyStart";

export default async function ApplyPage({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = await params;
  const p = getParty(partyId);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="font-semibold text-brand-2">{p.title}</p>
      <h1 className="mt-1 text-4xl">Apply with your profile</h1>
      <p className="mt-3 text-white/75">Members read this and vote on whether you get in.</p>
      <ApplyStart partyId={p.id} price={dynamicPrice(p)} />
    </div>
  );
}
