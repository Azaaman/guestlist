export interface ApplicationForm {
  name: string;
  age: number;
  gender: "man" | "woman";
  instagram?: string;
  inviteCode?: string;
  lookingFor: string;
  into: string;
  skill?: string; // older rows
  about: string;
  conduct: boolean;
  pass?: boolean; // Season Pass holder (set by the server only)
  profileId?: string; // on a booking: the profile it was made with
}

export interface AIProfile {
  headline: string;
  bio: string;
  strengths: string[];
  vibe: string;
  icebreaker: string;
  moderatorNote?: string;
}

export interface Trust {
  score: number;
  badges: { label: string; ok: boolean; note?: string }[];
  redFlags: string[];
}

// Profiles and bookings share the `applications` table.
// Profile rows (party_id "profile"): AI screening sets verified or rejected; a moderator can later ban.
// Booking rows (party_id = party): reviewed (card step) → approved (ticket) → maybe cancelled; or waitlist.
export type ProfileStatus = "pending" | "verified" | "rejected" | "banned";
export type BookingStatus = "reviewed" | "approved" | "waitlist" | "cancelled";

export interface BookingMeta {
  position?: number; // waitlist
  reason?: string;
  price?: number; // ticket price fixed at booking (0 with a Season Pass)
  deposit?: number; // damage deposit held on the card
  settled?: string; // what happened to the card hold after the party
}

export interface ApplicationRow {
  id: string;
  party_id: string;
  form: ApplicationForm;
  profile: AIProfile | null;
  votes: BookingMeta | null; // booking metadata (waitlist position and reason)
  trust: Trust | null;
  status: string;
  payment_intent_id: string | null;
  created_at: string;
}

export const PROFILE = "profile";
// Minimum AI trust score for a profile to be verified without any human involved.
export const MIN_TRUST = 40;
export function profileStatus(raw: string, trust?: Trust | null): ProfileStatus {
  if (raw === "verified" || raw === "pass") return "verified"; // "pass" is from an older version
  if (raw === "rejected" || raw === "banned") return raw;
  // Rows saved by an older version waited for a moderator; AI's verdict now decides them too.
  if (trust) return trust.redFlags.length === 0 && trust.score >= MIN_TRUST ? "verified" : "rejected";
  return "pending";
}
