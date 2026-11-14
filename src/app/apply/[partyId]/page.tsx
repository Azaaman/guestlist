import { notFound } from "next/navigation";
import { getParty } from "@/lib/data";
import ApplyForm from "./ApplyForm";

export default async function ApplyPage({ params }: { params: Promise<{ partyId: string }> }) {
  const { partyId } = await params;
  const p = getParty(partyId);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="font-semibold text-brand-2">{p.title}</p>
      <h1 className="mt-1 text-4xl">Tell the room who you are</h1>
      <p className="mt-3 text-white/70">Members read this and vote on whether you get in. Be specific. Effort gets approved, one-liners don&apos;t.</p>
      <ApplyForm partyId={p.id} />
    </div>
  );
}
