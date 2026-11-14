import { notFound } from "next/navigation";
import { getHost, getParty } from "@/lib/data";
import Phone from "./Phone";

export default async function PlayPage({ params, searchParams }: { params: Promise<{ sid: string }>; searchParams: Promise<{ ticket?: string }> }) {
  const { sid } = await params;
  const { ticket } = await searchParams;
  const p = getParty(sid);
  if (!p) notFound();
  return <Phone sid={sid} title={p.title} hostName={getHost(p.hostId)?.name ?? "the host"} ticket={ticket ?? null} />;
}
