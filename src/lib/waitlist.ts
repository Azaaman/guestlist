import { db } from "@/lib/db";
import type { Party } from "@/lib/data";

// The waitlist order is always: Season Pass holders first (oldest first), then everyone else (oldest first).
// Guests already waiting before the demo (party.waitlist) count as non-pass, earliest of all.
// A pass holder who joins therefore moves every non-pass guest one place down.
export async function waitlistPosition(party: Party, bookingId: string) {
  const { data } = await db().from("applications").select("id,form,created_at").eq("party_id", party.id).eq("status", "waitlist").order("created_at");
  const rows = (data ?? []) as { id: string; form: { pass?: boolean }; created_at: string }[];
  const pass = rows.filter((r) => r.form.pass);
  const rest = rows.filter((r) => !r.form.pass);
  const i = pass.findIndex((r) => r.id === bookingId);
  if (i >= 0) return { position: i + 1, total: rows.length + party.waitlist, passAhead: i, pass: true };
  const j = rest.findIndex((r) => r.id === bookingId);
  if (j < 0) return null;
  return { position: pass.length + party.waitlist + j + 1, total: rows.length + party.waitlist, passAhead: pass.length, pass: false };
}
