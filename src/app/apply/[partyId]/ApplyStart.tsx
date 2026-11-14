"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { fetchProfile, type SavedProfile } from "@/lib/profile";

// Applying is one tap: the saved profile is what members read.
export default function ApplyStart({ partyId, price }: { partyId: string; price: number }) {
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

  async function apply() {
    if (!profile) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ partyId, profileId: profile.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The application could not be sent. Try again.");
      router.push(`/application/${data.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The application could not be sent. Try again.");
      setBusy(false);
    }
  }

  if (!profile) return <p className="mt-8 text-white/60">Loading your profile…</p>;
  const f = profile.form;
  return (
    <div className="mt-8 space-y-5">
      <div className="paper p-5">
        <div className="flex items-center gap-3">
          <Avatar name={f.name} size={52} />
          <div className="min-w-0 flex-1">
            <div className="display text-2xl">{f.name}, {f.age}</div>
            <div className="text-sm text-paper-ink/70">Into {f.into?.toLowerCase()}. Looking for: {f.lookingFor}</div>
          </div>
          <Link href={`/profile?next=/apply/${partyId}`} className="shrink-0 text-sm font-semibold text-[#4a33c9] hover:underline">Edit</Link>
        </div>
        <p className="rule mt-3 pt-3">{f.about}</p>
      </div>
      <p className="text-white/75">
        {profile.pass
          ? "You hold a Season Pass, so there is nothing to pay. Members vote and, if approved, the address unlocks."
          : `Next you place a $${price} hold on your card. If members approve you it is charged; if not, it is released.`}
      </p>
      {err && <div className="rounded-xl bg-hot/15 p-3 text-sm">{err}</div>}
      <button className="btn btn-primary w-full text-lg" onClick={apply} disabled={busy}>
        {busy ? "AI is reading your profile…" : "Send my application"}
      </button>
    </div>
  );
}
