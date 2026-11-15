// Page for one booking (the URL keeps the older word "application").
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dynamicPrice, getParty } from "@/lib/data";
import { fmtDate } from "@/components/ui";
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
      <p className="font-semibold text-brand-2">{p.title}</p>
      <h1 className="mt-1 text-4xl">Your booking</h1>
      <ApplicationFlow
        id={id}
        partyTitle={p.title}
        partyId={p.id}
        partyWhen={fmtDate(p.date)}
        partyDate={p.date}
        price={dynamicPrice(p)}
        live={!!p.live}
      />
    </div>
  );
}
