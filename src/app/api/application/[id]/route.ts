import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getParty } from "@/lib/data";
import type { ApplicationRow } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await db().from("applications").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = data as ApplicationRow;
  const party = getParty(row.party_id);
  // The address is only shown once the place is booked.
  const reveal = row.status === "approved" && party ? { address: party.address, dressCode: party.dressCode } : null;
  return NextResponse.json({ id: row.id, party_id: row.party_id, status: row.status, form: { name: row.form.name, pass: !!row.form.pass }, meta: row.votes, reveal });
}
