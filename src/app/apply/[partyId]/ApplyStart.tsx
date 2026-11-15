"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { fetchProfile, type SavedProfile } from "@/lib/profile";
import { DEPOSIT } from "@/lib/room";

// Booking is one tap for a verified guest: no form, no vote.
export default function ApplyStart({ partyId, price, left }: { partyId: string; price: number; left: number }) {
  const router = useRouter();
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchProfile().then((p) => {
      if (!p) router.replace(`/profile?next=/apply/${partyId}`);
      else setProfile(p);
    });
  }, [partyId, router]);

  async function book() {
    if (!profile) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId, profileId: profile.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The booking could not be made. Try again.");
      router.push(`/application/${data.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The booking could not be made. Try again.");
      setBusy(false);
    }
  }

  if (!profile) return <p className="mt-8 text-white/60">Loading your profile…</p>;
  const f = profile.form;
  const open = left > 0;

  if (profile.status !== "verified")
    return (
      <div className="card mt-8 p-5">
        <div className="text-lg font-semibold">
          {profile.status === "pending" ? "Your profile has not been checked yet" : profile.status === "banned" ? "This profile is permanently banned" : "Your profile was not accepted"}
        </div>
        <p className="mt-1 text-white/75">Only verified guests can book a party.</p>
        <Link href={`/profile?next=/apply/${partyId}`} className="btn btn-primary mt-4">Go to my profile</Link>
      </div>
    );

  return (
    <div className="mt-8 space-y-5">
      <div className="paper p-5">
        <div className="flex items-center gap-3">
          <Avatar name={f.name} size={52} />
          <div className="min-w-0 flex-1">
            <div className="display text-2xl">{f.name}, {f.age}</div>
            <div className="text-sm font-semibold text-[#1f8a5b]">Verified guest{profile.pass ? ", Season Pass holder" : ""}</div>
          </div>
          <Link href="/profile" className="shrink-0 text-sm font-semibold text-[#4a33c9] hover:underline">Edit</Link>
        </div>
      </div>
      <p className="text-white/80">
        {open
          ? profile.pass
            ? `A place is free and your Season Pass covers the ticket. Only the $${DEPOSIT} damage deposit is held on your card, and released after the party.`
            : `A place is free. The $${price} ticket and a $${DEPOSIT} damage deposit are held on your card. The address unlocks straight away.`
          : `The party is full. You can join the waitlist${profile.pass ? " at the front, ahead of guests without a pass." : "."}`}
      </p>
      {err && <div className="rounded-xl bg-hot/15 p-3 text-sm">{err}</div>}
      <button className="btn btn-primary w-full text-lg" onClick={book} disabled={busy}>
        {busy ? "Booking…" : open ? (profile.pass ? "Book with my Season Pass" : `Book for $${price}`) : "Join the waitlist"}
      </button>
    </div>
  );
}
