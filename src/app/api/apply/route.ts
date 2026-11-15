import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dynamicPrice, getParty } from "@/lib/data";
import { DEPOSIT } from "@/lib/room";
import { PROFILE, profileStatus, type ApplicationRow, type BookingMeta } from "@/lib/types";

// Book a place at a party with a verified profile.
// Order of checks: verified → not already booked → room left. There is no gender quota.
// A Season Pass holder pays nothing for the ticket and goes to the front of any waitlist.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { partyId: string; profileId: string };
    const party = getParty(body.partyId);
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    const { data: p } = await db().from("applications").select("*").eq("id", body.profileId ?? "").eq("party_id", PROFILE).maybeSingle();
    const prof = p as ApplicationRow | null;
    if (!prof) return NextResponse.json({ error: "Create your profile first." }, { status: 400 });
    const status = profileStatus(prof.status, prof.trust);
    if (status === "banned") return NextResponse.json({ error: "This profile is permanently banned." }, { status: 403 });
    if (status !== "verified") return NextResponse.json({ error: "Your profile has not been verified yet." }, { status: 403 });
    const f = prof.form;
    const hasPass = !!f.pass || prof.status === "pass";

    const { data: rows } = await db().from("applications").select("id,form,status,created_at").eq("party_id", party.id).in("status", ["approved", "waitlist", "reviewed"]);
    const bookings = (rows ?? []) as Pick<ApplicationRow, "id" | "form" | "status" | "created_at">[];
    const mine = bookings.find((b) => b.form.profileId === prof.id);
    if (mine) return NextResponse.json({ id: mine.id });

    const booked = bookings.filter((b) => b.status === "approved").length;
    const full = party.men + party.women + booked >= party.spots;

    const form = { ...f, pass: hasPass, profileId: prof.id };
    let bookingStatus: string;
    let meta: BookingMeta | null = null;
    if (full) {
      // Position is worked out live when the booking is read (see lib/waitlist), so pass holders always come first.
      bookingStatus = "waitlist";
      meta = {
        reason: "The party is full.",
      };
    } else {
      // Next step for everyone: one card hold. Ticket (free with a pass) plus the damage deposit.
      bookingStatus = "reviewed";
      meta = { price: hasPass ? 0 : dynamicPrice(party), deposit: DEPOSIT };
    }

    const { data, error } = await db()
      .from("applications")
      .insert({ party_id: party.id, form, profile: prof.profile, trust: prof.trust, votes: meta, status: bookingStatus })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "The booking could not be made." }, { status: 500 });
  }
}
