export interface ApplicationForm {
  name: string;
  age: number;
  gender: "man" | "woman";
  instagram?: string;
  inviteCode?: string;
  lookingFor: string;
  into: string;
  skill?: string; // older applications
  about: string;
  conduct: boolean;
  pass?: boolean; // Season Pass holder at the time of applying: no card hold needed
}

export interface AIProfile {
  headline: string;
  bio: string;
  strengths: string[];
  vibe: string;
  icebreaker: string;
}

export interface Vote {
  voterId: string;
  voter: string;
  vote: "yes" | "no";
  reason: string;
}

export interface Trust {
  score: number;
  badges: { label: string; ok: boolean; note?: string }[];
  redFlags: string[];
}

export interface ApplicationRow {
  id: string;
  party_id: string;
  form: ApplicationForm;
  profile: AIProfile | null;
  votes: Vote[] | null;
  trust: Trust | null;
  status: "reviewed" | "held" | "approved" | "rejected";
  payment_intent_id: string | null;
  created_at: string;
}

export const APPROVALS_NEEDED = 3;
