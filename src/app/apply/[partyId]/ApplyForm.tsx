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

// A low-effort, disrespectful application: shows that screening and the vote can say no.
const RUDE = {
  name: "Chad Miller",
  age: "36",
  gender: "man",
  instagram: "",
  inviteCode: "",
  skill: "Dancing",
  lookingFor: "hot girls, whatever",
  about: "I don't do rules. Just here to drink and see who I can take home. Don't waste my time with quizzes.",
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
      if (!res.ok) throw new Error(data.error || "The application could not be sent. Try again.");
      router.push(`/application/${data.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The application could not be sent. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div className="rounded-xl border border-dashed border-line p-3 text-sm">
        <div className="font-semibold">Trying the demo?</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setF(SAMPLE); setConduct(true); }} className="btn btn-ghost min-h-0 flex-1 px-3 py-2 text-sm">Fill in a strong application</button>
          <button type="button" onClick={() => { setF(RUDE); setConduct(true); }} className="btn btn-ghost min-h-0 flex-1 px-3 py-2 text-sm">Fill in one that gets rejected</button>
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
            <button type="button" key={g} onClick={() => setF({ ...f, gender: g })}
              className={`min-h-12 rounded-xl border px-4 py-3 font-semibold capitalize ${f.gender === g ? "border-brand-2 bg-brand-2/15" : "border-line"}`}>{g}</button>
          ))}
        </div>
      </div>
      <label className="reveal block"><span className="label">Best contest skill</span>
        <select className="input mt-1" value={f.skill} onChange={set("skill")}>
          {CONTEST_SKILLS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="reveal block"><span className="label">What are you looking for?</span>
        <input className="input mt-1" value={f.lookingFor} onChange={set("lookingFor")} placeholder="New friends, a partner, a fun crew…" required />
      </label>
      <label className="reveal block"><span className="label">About you (2–3 sentences)</span>
        <textarea className="input mt-1 min-h-28" value={f.about} onChange={set("about")} required />
      </label>
      <div className="reveal grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Instagram (optional)</span><input className="input mt-1" value={f.instagram} onChange={set("instagram")} placeholder="@handle" /></label>
        <label className="block"><span className="label">Invite code (optional)</span><input className="input mt-1" value={f.inviteCode} onChange={set("inviteCode")} placeholder="From a member" /></label>
      </div>
      <label className="flex items-start gap-3 text-sm text-white/80">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#7c6cf2]" checked={conduct} onChange={(e) => setConduct(e.target.checked)} />
        <span>I accept the code of conduct: respect, consent, no harassment. Breaking it means a permanent ban tied to my ID.</span>
      </label>
      {err && <div className="rounded-xl bg-hot/15 p-3 text-sm">{err}</div>}
      <button className="btn btn-primary w-full text-lg" disabled={busy || !f.gender}>
        {busy ? "AI is reading your application…" : "Send my application"}
      </button>
    </form>
  );
}
