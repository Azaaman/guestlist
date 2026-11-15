"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchProfile, setProfileId, type SavedProfile } from "@/lib/profile";
import { Avatar } from "@/components/ui";
import { INTERESTS } from "@/lib/room";

const SAMPLE = {
  name: "Alex Rivera",
  age: "34",
  gender: "man",
  instagram: "@alex.rivera.mia",
  inviteCode: "SARAH-K",
  into: "Food",
  lookingFor: "New friends in Miami. I miss having a crew for Friday nights and weekend plans.",
  about: "Moved here from Denver for a job in renewable energy. I make a mean green-chile stew, run the Venetian Causeway on weekends, and I'm happiest hosting a long dinner for people who just met.",
};

// A disrespectful profile: shows that AI screening can say no.
const RUDE = {
  name: "Chad Miller",
  age: "36",
  gender: "man",
  instagram: "",
  inviteCode: "",
  into: "Music",
  lookingFor: "hot girls, whatever",
  about: "I don't do rules. Just here to drink and see who I can take home. Don't waste my time with small talk.",
};

export default function ProfileForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [f, setF] = useState({ name: "", age: "", gender: "", instagram: "", inviteCode: "", into: INTERESTS[0], lookingFor: "", about: "" });
  const [conduct, setConduct] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [pass, setPass] = useState(false);
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSaved(false);
    setF({ ...f, [k]: e.target.value });
  };

  // An existing profile is loaded for editing.
  useEffect(() => {
    fetchProfile().then((p) => {
      if (p) {
        setProfile(p);
        setId(p.id);
        setPass(p.pass);
        setConduct(true);
        setF({ name: p.form.name, age: String(p.form.age), gender: p.form.gender, instagram: p.form.instagram ?? "", inviteCode: p.form.inviteCode ?? "", into: p.form.into ?? INTERESTS[0], lookingFor: p.form.lookingFor, about: p.form.about });
      }
      setLoaded(true);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, form: { ...f, age: Number(f.age), conduct } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The profile could not be saved. Try again.");
      setProfileId(data.id);
      setId(data.id);
      const fresh = await fetchProfile();
      setProfile(fresh);
      if (fresh?.status === "verified" && next && next.startsWith("/")) router.push(next);
      else setSaved(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The profile could not be saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <p className="mt-8 text-white/60">Loading…</p>;

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      {profile && <Verification profile={profile} pass={pass} />}
      <div className="rounded-xl border border-dashed border-line p-3 text-sm">
        <div className="font-semibold">Trying the demo? Fill in a sample guest</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setF(SAMPLE); setConduct(true); setSaved(false); }} className="btn btn-ghost min-h-0 flex-1 px-3 py-2 text-sm">A guest who gets approved</button>
          <button type="button" onClick={() => { setF(RUDE); setConduct(true); setSaved(false); }} className="btn btn-ghost min-h-0 flex-1 px-3 py-2 text-sm">A guest who gets rejected</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="col-span-2 block"><span className="label">Name</span><input className="input mt-1" value={f.name} onChange={set("name")} required /></label>
        <label className="block"><span className="label">Age</span><input className="input mt-1" type="number" min={25} max={45} value={f.age} onChange={set("age")} required /></label>
      </div>
      <div>
        <span className="label">I am a</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {["man", "woman"].map((g) => (
            <button type="button" key={g} onClick={() => { setSaved(false); setF({ ...f, gender: g }); }}
              className={`min-h-12 rounded-xl border px-4 py-3 font-semibold capitalize ${f.gender === g ? "border-brand-2 bg-brand/40" : "border-line"}`}>{g}</button>
          ))}
        </div>
      </div>
      <label className="reveal block"><span className="label">I&apos;m into</span>
        <select className="input mt-1" value={f.into} onChange={set("into")}>
          {INTERESTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="reveal block"><span className="label">What are you looking for?</span>
        <input className="input mt-1" value={f.lookingFor} onChange={set("lookingFor")} placeholder="New friends, a crew for weekends, people to explore Miami with…" required />
      </label>
      <label className="reveal block"><span className="label">About you (2–3 sentences)</span>
        <textarea className="input mt-1 min-h-28" value={f.about} onChange={set("about")} required />
      </label>
      <div className="reveal grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Instagram (optional)</span><input className="input mt-1" value={f.instagram} onChange={set("instagram")} placeholder="@handle" /></label>
        <label className="block"><span className="label">Invite code (optional)</span><input className="input mt-1" value={f.inviteCode} onChange={set("inviteCode")} placeholder="From a member" /></label>
      </div>
      <label className="flex items-start gap-3 text-sm text-white/80">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#17103f]" checked={conduct} onChange={(e) => { setSaved(false); setConduct(e.target.checked); }} />
        <span>I accept the <Link href="/policy" className="font-semibold text-brand-2 underline">house rules</Link>: respect, consent, no harassment. Breaking them can mean a permanent ban.</span>
      </label>
      {err && <div className="rounded-xl bg-hot/15 p-3 text-sm">{err}</div>}
      {saved && <div className="rounded-xl bg-mint/15 p-3 text-sm">Saved and checked by AI. Your result is at the top of this page.</div>}
      <button className="btn btn-primary w-full text-lg" disabled={busy || !f.gender}>
        {busy ? "AI is checking your profile…" : id ? "Save changes and re-check" : "Create my profile"}
      </button>
    </form>
  );
}

// Where the profile stands: AI screening first, then a human moderator.
function Verification({ profile, pass }: { profile: SavedProfile; pass: boolean }) {
  const t = profile.trust;
  const c = profile.card;
  const label = { pending: "Not checked yet", verified: "Verified by AI", rejected: "Not accepted", banned: "Permanently banned" }[profile.status];
  const tone = { pending: "text-[#a8690a]", verified: "text-[#1f8a5b]", rejected: "text-[#b0283f]", banned: "text-[#b0283f]" }[profile.status];
  return (
    <div className="paper p-5">
      <div className="flex items-center gap-3">
        <Avatar name={profile.form.name} size={48} />
        <div className="min-w-0 flex-1">
          <div className={`font-bold ${tone}`}>{label}{pass ? ", Season Pass holder" : ""}</div>
          {c && <div className="text-sm text-paper-ink/75">{c.headline}</div>}
        </div>
        {t && <div className="display text-3xl">{t.score}<span className="text-base font-semibold text-paper-ink/60"> / 100</span></div>}
      </div>
      {c && <p className="rule mt-3 pt-3 text-sm">{c.bio}</p>}
      {t && t.redFlags.length > 0 && <p className="mt-3 rounded bg-[#b0283f]/10 p-3 text-sm font-semibold text-[#8f1f33]">AI screening flagged: {t.redFlags.join("; ")}. Edit your profile below to be checked again.</p>}
      {profile.status === "pending" && <p className="rule mt-3 pt-3 text-sm">Save your profile below and AI will check it in a few seconds.</p>}
      {profile.status === "rejected" && t && t.redFlags.length === 0 && <p className="mt-3 rounded bg-[#b0283f]/10 p-3 text-sm font-semibold text-[#8f1f33]">There is too little here for AI to verify you. Tell us more about yourself below and save again.</p>}
      {c?.moderatorNote && profile.status !== "pending" && <p className="mt-3 text-sm text-paper-ink/70">Why this score: {c.moderatorNote}</p>}
      {profile.status === "verified" && (
        <div className="rule mt-3 flex flex-col gap-2 pt-3 sm:flex-row">
          <Link href="/parties" className="btn btn-paper">Choose a party</Link>
          {!pass && <Link href="/pass" className="btn border-paper-ink/30 text-paper-ink">Get a Season Pass</Link>}
          <Link href="/host/apply" className="btn border-paper-ink/30 text-paper-ink">I want to become a host</Link>
        </div>
      )}
    </div>
  );
}
