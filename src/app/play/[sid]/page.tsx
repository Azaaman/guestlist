import { notFound } from "next/navigation";
import { getParty } from "@/lib/data";
import Phone from "./Phone";

export default async function PlayPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  const p = getParty(sid);
  if (!p) notFound();
  return <Phone sid={sid} title={p.title} />;
}
