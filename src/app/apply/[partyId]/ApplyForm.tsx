"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONTEST_SKILLS } from "@/lib/data";

const SAMPLE = {
  name: "Alex Rivera",
  age: "34",
  gender: "man",
  instagram: "@alex.rivera.atx",
  inviteCode: "SARAH-K",
  skill: "Cooking",
  lookingFor: "New friends in Austin and maybe someone special — I miss having a crew for Friday nights.",
  about: "Moved here from Denver for a job in renewable energy. I make a mean green-chile stew, run the Town Lake loop on weekends, and I'm the guy who knows the answer to the obscure trivia question.",
};

export default function ApplyForm({ partyId }: { partyId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", age: "", gender: "", instagram: "", inviteCode: "", skill: "Trivia", lookingFor: "", about: "" });
  const [conduct, setConduct] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, form: { ...f, age: Number(f.age), conduct } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      router.push(`/application/${data.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <button type="button" onClick={() => { setF(SAMPLE); setConduct(true); }} className="text-sm text-brand-2 underline underline-offset-4">
        Fill with a sample guest (for the demo)
      </button>
      <div className="grid grid-cols-3 gap-3">
        <label className="col-span-2 block"><span className="label">Name</span><input className="input mt-1" value={f.name} onChange={set("name")} required /></label>
        <label className="block"><span className="label">Age</span><input className="input mt-1" type="number" min={25} max={45} value={f.age} onChange={set("age")} required /></label>
      </div>
      <div>
        <span className="label">I am a</span>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {["man", "woman"].map((g) => (
            <button type="button" key={g} onClick={() => setF({ ...f, gender: g })}
              className={`rounded-xl border px-4 py-3 font-semibold capitalize ${f.gender === g ? "border-brand bg-brand/20" : "border-line"}`}>{g}</button>
          ))}
        </div>
      </div>
      <label className="block"><span className="label">Best contest skill</span>
        <select className="input mt-1" value={f.skill} onChange={set("skill")}>
          {CONTEST_SKILLS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="block"><span className="label">What are you looking for?</span>
        <input className="input mt-1" value={f.lookingFor} onChange={set("lookingFor")} placeholder="New friends, a partner, a fun crew…" required />
      </label>
      <label className="block"><span className="label">About you (2–3 sentences)</span>
        <textarea className="input mt-1 min-h-28" value={f.about} onChange={set("about")} required />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Instagram (optional)</span><input className="input mt-1" value={f.instagram} onChange={set("instagram")} placeholder="@handle" /></label>
        <label className="block"><span className="label">Invite code (optional)</span><input className="input mt-1" value={f.inviteCode} onChange={set("inviteCode")} placeholder="From a member" /></label>
      </div>
      <label className="flex items-start gap-3 text-sm text-white/80">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#6c5ce7]" checked={conduct} onChange={(e) => setConduct(e.target.checked)} />
        <span>I accept the code of conduct: respect, consent, no harassment. Violations = permanent ban tied to my ID.</span>
      </label>
      {err && <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>}
      <button className="btn btn-primary w-full text-lg" disabled={busy || !f.gender}>
        {busy ? "AI is reading your application…" : "Submit application"}
      </button>
    </form>
  );
}
