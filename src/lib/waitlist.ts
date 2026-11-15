import { db } from "@/lib/db";
import type { Party } from "@/lib/data";

// The waitlist order is always: Season Pass holders first (oldest first), then everyone else (oldest first).
// Pass status is read from each guest's profile right now, not from the booking, so buying a pass
// after joining the queue moves you to the front at once.
// Guests already waiting before the demo (party.waitlist) count as non-pass, earliest of all.
export async function waitlistPosition(party: Party, bookingId: string) {
  const { data } = await db()
    .from("applications")
    .select("id,form,created_at")
    .eq("party_id", party.id)
    .eq("status", "waitlist")
    .order("created_at");
  const rows = (data ?? []) as {
    id: string;
    form: { pass?: boolean; profileId?: string };
    created_at: string;
  }[];
  const ids = [...new Set(rows.map((r) => r.form.profileId).filter((x): x is string => !!x))];
  const { data: profs } = ids.length
    ? await db().from("applications").select("id,form,status").in("id", ids)
    : { data: [] };
  const hasPass = (r: (typeof rows)[number]) => {
    const p = (profs ?? []).find((x) => x.id === r.form.profileId);
    return p ? !!p.form?.pass || p.status === "pass" : !!r.form.pass;
  };
  const pass = rows.filter(hasPass);
  const rest = rows.filter((r) => !hasPass(r));
  const total = rows.length + party.waitlist;
  const i = pass.findIndex((r) => r.id === bookingId);
  if (i >= 0)
    return {
      position: i + 1,
      total,
      passAhead: i,
      othersBehind: total - i - 1,
      pass: true,
      seeded: party.waitlist,
    };
  const j = rest.findIndex((r) => r.id === bookingId);
  if (j < 0) return null;
  return {
    position: pass.length + party.waitlist + j + 1,
    total,
    passAhead: pass.length,
    othersBehind: 0,
    pass: false,
    seeded: party.waitlist,
  };
}
