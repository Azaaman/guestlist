// Page: the big screen for one party.
import { notFound } from "next/navigation";
import { getParty } from "@/lib/data";
import BigScreen from "./BigScreen";

export default async function LivePage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const p = getParty(sid);
  if (!p) notFound();
  return <BigScreen sid={sid} title={p.title} />;
}
