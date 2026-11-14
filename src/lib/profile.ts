"use client";
// The guest's profile lives in the database; this device only remembers its id.
// No password or sign-up: the brief requires the product to work without a login.
const KEY = "nestly_profile";

export function getProfileId(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setProfileId(id: string) {
  try { localStorage.setItem(KEY, id); } catch {}
}

export interface SavedProfile {
  id: string;
  form: { name: string; age: number; gender: "man" | "woman"; instagram?: string; inviteCode?: string; lookingFor: string; into: string; about: string; conduct: boolean };
  pass: boolean;
  status: "pending" | "verified" | "rejected" | "banned";
  card: { headline: string; bio: string; strengths: string[]; vibe: string; icebreaker: string; moderatorNote?: string } | null;
  trust: { score: number; badges: { label: string; ok: boolean; note?: string }[]; redFlags: string[] } | null;
}

export async function fetchProfile(): Promise<SavedProfile | null> {
  const id = getProfileId();
  if (!id) return null;
  try {
    const res = await fetch(`/api/profile?id=${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SavedProfile;
  } catch {
    return null;
  }
}
