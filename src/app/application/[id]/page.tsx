import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dynamicPrice, getParty } from "@/lib/data";
import ApplicationFlow from "./ApplicationFlow";

export const dynamic = "force-dynamic";

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await db().from("applications").select("party_id").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = getParty(data.party_id);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="label">Application · {p.title}</p>
      <h1 className="mt-2 text-3xl font-black">Your application</h1>
      <ApplicationFlow id={id} partyTitle={p.title} partyId={p.id} price={dynamicPrice(p)} live={!!p.live} />
    </div>
  );
}
