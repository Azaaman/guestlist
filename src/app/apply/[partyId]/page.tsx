import { notFound } from "next/navigation";
import { getParty } from "@/lib/data";
import ApplyForm from "./ApplyForm";

export default async function ApplyPage({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = await params;
  const p = getParty(partyId);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="label">Apply · {p.title}</p>
      <h1 className="mt-2 text-3xl font-black">Tell the room who you are</h1>
      <p className="mt-2 text-white/65">Members of the opposite gender will read this and vote. Be real — effort gets approved.</p>
      <ApplyForm partyId={p.id} />
    </div>
  );
}
