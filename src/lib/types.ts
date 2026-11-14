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
// Profile rows (party_id "profile"): pending → verified | rejected, later possibly banned.
// Booking rows (party_id = party): reviewed (awaiting payment) → approved (ticket), or waitlist.
export type ProfileStatus = "pending" | "verified" | "rejected" | "banned";
export type BookingStatus = "reviewed" | "approved" | "waitlist";

export interface BookingMeta {
  position?: number;
  reason?: string;
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
export function profileStatus(raw: string): ProfileStatus {
  if (raw === "verified" || raw === "pass") return "verified"; // "pass" is from an older version
  if (raw === "rejected" || raw === "banned") return raw;
  return "pending";
}
