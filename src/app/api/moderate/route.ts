import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decideCase, loadCases } from "@/lib/live";
import type { HostFiles } from "@/lib/hosting";

export const dynamic = "force-dynamic";

// The moderator's desk: host applications (documents and house photos) and conduct cases from parties.
// Guest profiles never come here; AI verifies them. Open in this demo so the flow can be tried;
// in production it sits behind staff login.
export async function GET() {
  try {
    const { data } = await db().from("applications").select("id,form,status,votes,created_at").eq("party_id", "host").order("created_at", { ascending: false }).limit(20);
    const hosts = await Promise.all(
      (data ?? []).map(async (r) => {
        const files = ((r.votes as { files?: HostFiles } | null)?.files ?? { id: [], ownership: [], photos: [] }) as HostFiles;
        const all = [...files.id, ...files.ownership, ...files.photos];
        const { data: signed } = all.length ? await db().storage.from("host-documents").createSignedUrls(all, 3600) : { data: [] };
        const url = (p: string) => signed?.find((s) => s.path === p)?.signedUrl ?? null;
        return {
          id: r.id, form: r.form, status: r.status, created_at: r.created_at,
          files: { id: files.id.map(url), ownership: files.ownership.map(url), photos: files.photos.map(url) },
        };
      }),
    );
    return NextResponse.json({ cases: (await loadCases()).slice(0, 30), hosts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as { caseId?: string; decision?: "ban" | "clear"; hostId?: string; hostDecision?: "approve" | "reject"; note?: string };
  if (body.hostId) {
    if (body.hostDecision !== "approve" && body.hostDecision !== "reject") return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
    const { data, error } = await db().from("applications")
      .update({ status: body.hostDecision === "approve" ? "approved" : "rejected", trust: { note: (body.note ?? "").trim().slice(0, 300) || null } })
      .eq("id", body.hostId).eq("party_id", "host").eq("status", "pending").select("id").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "This application is already decided." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  if (!body.caseId || (body.decision !== "ban" && body.decision !== "clear")) return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
  const c = await decideCase(body.caseId, body.decision);
  if (!c) return NextResponse.json({ error: "This case is already closed." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
