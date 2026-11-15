// GET one booking: its status, card-hold details, waitlist position and (once booked) the address.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getParty } from "@/lib/data";
import { CANCEL_HOURS } from "@/lib/room";
import { waitlistPosition } from "@/lib/waitlist";
import type { ApplicationRow } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await db().from("applications").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = data as ApplicationRow;
  const party = getParty(row.party_id);
  // The address is only shown once the place is booked.
  const reveal =
    row.status === "approved" && party ? { address: party.address, dressCode: party.dressCode } : null;
  const refundable = !!party && (new Date(party.date).getTime() - Date.now()) / 3600000 >= CANCEL_HOURS;
  const queue = row.status === "waitlist" && party ? await waitlistPosition(party, row.id) : null;
  return NextResponse.json({
    id: row.id,
    party_id: row.party_id,
    status: row.status,
    form: { name: row.form.name, pass: queue ? queue.pass : !!row.form.pass },
    meta: row.votes,
    reveal,
    refundable,
    queue,
  });
}
