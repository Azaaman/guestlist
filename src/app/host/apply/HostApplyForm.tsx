"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProfile } from "@/lib/profile";
import { HOST_LIMITS, HOST_THEMES, NEIGHBORHOODS } from "@/lib/hosting";

const KEY = "nestly_host_application";

// Photos are resized in the browser so a whole application stays under the upload limit.
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/jpeg", 0.72));
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

interface Status { status: "pending" | "approved" | "rejected"; form: { title: string; theme: string; name: string }; note: string | null }

export default function HostApplyForm() {
  const [existing, setExisting] = useState<Status | null>(null);
  const [checked, setChecked] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", neighborhood: "", address: "", capacity: "20", occupancy: "owner", theme: "", title: "", about: "" });
  const [profileId, setProfileId] = useState<string | undefined>();
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [ownDoc, setOwnDoc] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Show the status of an application sent from this device; otherwise prefill from the guest profile.
  useEffect(() => {
    (async () => {
      let id: string | null = null;
      try { id = localStorage.getItem(KEY); } catch {}
      if (id) {
        const res = await fetch(`/api/host-apply?id=${id}`, { cache: "no-store" });
        if (res.ok) setExisting(await res.json());
      }
      const p = await fetchProfile();
      if (p) {
        setProfileId(p.id);
        setF((x) => ({ ...x, name: p.form.name }));
      }
      setChecked(true);
    })();
  }, []);

  // While a moderator is deciding, keep checking.
  useEffect(() => {
    if (existing?.status !== "pending") return;
    const t = setInterval(async () => {
      let id: string | null = null;
      try { id = localStorage.getItem(KEY); } catch {}
      const res = await fetch(`/api/host-apply?id=${id}`, { cache: "no-store" });
      if (res.ok) setExisting(await res.json());
    }, 4000);
    return () => clearInterval(t);
  }, [existing?.status]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const theme = HOST_THEMES.find((t) => t.theme === f.theme);

  async function pickPhotos(list: FileList | null) {
    if (!list) return;
    const next = [...photos, ...(await Promise.all([...list].map(shrink)))].slice(0, HOST_LIMITS.maxPhotos);
    setPhotos(next);
    setPreviews(next.map((p) => URL.createObjectURL(p)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!idDoc || !ownDoc) return setErr("Upload both documents.");
    if (photos.length < HOST_LIMITS.minPhotos) return setErr(`Add at least ${HOST_LIMITS.minPhotos} photos of the house.`);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("form", JSON.stringify({ ...f, capacity: Number(f.capacity), profileId }));
      fd.append("id", await shrink(idDoc));
      fd.append("ownership", await shrink(ownDoc));
      photos.forEach((p) => fd.append("photos", p));
      const res = await fetch("/api/host-apply", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({ error: res.status === 413 ? "The files are too large. Use fewer or smaller photos." : "The application could not be sent." }));
      if (!res.ok) throw new Error(data.error);
      try { localStorage.setItem(KEY, data.id); } catch {}
      const st = await fetch(`/api/host-apply?id=${data.id}`, { cache: "no-store" });
      if (st.ok) setExisting(await st.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "The application could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  if (!checked) return <p className="mt-8 text-white/60">Loading…</p>;

  if (existing && existing.status !== "rejected")
    return (
      <div className="paper mt-8 p-6">
        <div className={`font-bold ${existing.status === "approved" ? "text-[#1f8a5b]" : "text-[#a8690a]"}`}>{existing.status === "approved" ? "Approved. You are a Nestly host." : "Sent. A moderator is checking your documents and photos."}</div>
        <div className="display mt-1 text-3xl">{existing.form.title}</div>
        <div className="mt-1 text-paper-ink/75">{existing.form.theme}, hosted by {existing.form.name}</div>
        <p className="rule mt-4 pt-4">
          {existing.status === "approved"
            ? "The Nestly team will call you to set the date. Your night then goes on the line-up and guests can book it."
            : "This page updates by itself. Trying the demo? Open the moderator desk and approve the application."}
        </p>
        {existing.status === "pending" && <Link href="/moderate" target="_blank" className="btn btn-paper mt-4">Open the moderator desk</Link>}
        {existing.note && <p className="mt-3 text-sm text-paper-ink/70">Moderator&apos;s note: {existing.note}</p>}
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-8 space-y-8">
      {existing?.status === "rejected" && <div className="rounded-xl bg-hot/15 p-4">Your last application was not accepted{existing.note ? `: ${existing.note}` : "."} You can send a new one.</div>}

      <fieldset className="space-y-4">
        <legend className="text-2xl font-bold">About you</legend>
        <label className="block"><span className="label">Full name, as on your ID</span><input className="input mt-1" value={f.name} onChange={set("name")} required /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">Email</span><input className="input mt-1" type="email" value={f.email} onChange={set("email")} required /></label>
          <label className="block"><span className="label">Phone</span><input className="input mt-1" type="tel" value={f.phone} onChange={set("phone")} required /></label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-2xl font-bold">The house</legend>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <label className="block"><span className="label">Neighborhood</span>
            <select className="input mt-1" value={f.neighborhood} onChange={set("neighborhood")} required>
              <option value="">Choose</option>
              {NEIGHBORHOODS.map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Guests, max</span><input className="input mt-1" type="number" min={8} max={60} value={f.capacity} onChange={set("capacity")} required /></label>
        </div>
        <label className="block"><span className="label">Full address (only guests with a ticket ever see it)</span><input className="input mt-1" value={f.address} onChange={set("address")} required /></label>
        <div>
          <span className="label">I am the</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {([["owner", "Owner"], ["renter", "Renter, with permission"]] as const).map(([v, l]) => (
              <button type="button" key={v} onClick={() => setF({ ...f, occupancy: v })} aria-pressed={f.occupancy === v}
                className={`min-h-12 rounded-xl border px-3 font-semibold ${f.occupancy === v ? "border-brand-2 bg-brand/40" : "border-line"}`}>{l}</button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-2xl font-bold">Your night</legend>
        <p className="mt-1 text-sm text-white/65">Choose a theme, then one of its names. This is how your party appears in the line-up.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {HOST_THEMES.map((t) => (
            <button type="button" key={t.theme} onClick={() => setF({ ...f, theme: t.theme, title: "" })} aria-pressed={f.theme === t.theme}
              className={`min-h-16 rounded-xl border px-2 py-2 font-semibold ${f.theme === t.theme ? "border-transparent bg-hi text-[#17103f]" : "border-line hover:bg-panel"}`}>
              <span className="block text-xl" aria-hidden>{t.icon}</span>{t.theme}
            </button>
          ))}
        </div>
        {theme && (
          <div className="mt-4 space-y-2">
            {theme.titles.map((t) => (
              <label key={t} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 ${f.title === t ? "border-brand-2 bg-brand/40" : "border-line"}`}>
                <input type="radio" name="title" className="accent-[#b7abff]" checked={f.title === t} onChange={() => setF({ ...f, title: t })} />
                <span className="display text-lg">{t}</span>
              </label>
            ))}
          </div>
        )}
        <label className="mt-4 block"><span className="label">Anything guests should know (optional)</span><textarea className="input mt-1 min-h-20" value={f.about} onChange={set("about")} maxLength={500} /></label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-2xl font-bold">Documents</legend>
        <p className="text-sm text-white/65">JPG, PNG or PDF, up to {HOST_LIMITS.maxFileMB} MB each. Stored privately; only Nestly moderators can open them.</p>
        <FileField label="Government ID (driver's license or passport)" file={idDoc} onPick={setIdDoc} />
        <FileField label={f.occupancy === "owner" ? "Proof you own the house (deed or property tax bill)" : "Your lease, or the landlord's written permission to host"} file={ownDoc} onPick={setOwnDoc} />
      </fieldset>

      <fieldset>
        <legend className="text-2xl font-bold">Photos of the house</legend>
        <p className="mt-1 text-sm text-white/65">{HOST_LIMITS.minPhotos} to {HOST_LIMITS.maxPhotos} photos: the main room, the outdoor space, the kitchen and the bathroom guests will use.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-night">
              <img src={src} alt={`House photo ${i + 1}`} className="h-full w-full object-cover" />
              <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => { const n = photos.filter((_, j) => j !== i); setPhotos(n); setPreviews(n.map((p) => URL.createObjectURL(p))); }}
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-black/70 font-bold">×</button>
            </div>
          ))}
          {photos.length < HOST_LIMITS.maxPhotos && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line text-center text-sm text-white/70 hover:bg-panel">
              <span className="text-3xl" aria-hidden>+</span>Add photos
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { pickPhotos(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-white/85">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#6a55ff]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>I accept the <Link href="/policy" className="font-semibold text-brand-2 underline">house rules for hosts</Link>: guest limit, music and pool closed at 11 pm, no indoor cameras, and payouts only after guests rate the night.</span>
      </label>

      {err && <div className="rounded-xl bg-hot/15 p-3 text-sm">{err}</div>}
      <button className="btn btn-primary w-full text-lg" disabled={busy || !agree || !f.title}>{busy ? "Uploading…" : "Send for review"}</button>
    </form>
  );
}

function FileField({ label, file, onPick }: { label: string; file: File | null; onPick: (f: File | null) => void }) {
  return (
    <label className="flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-line px-4 py-3 hover:bg-panel">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className={`text-sm ${file ? "text-mint" : "text-white/55"}`}>{file ? `Added: ${file.name}` : "Tap to upload"}</span>
      </span>
      <span className="btn btn-ghost min-h-0 shrink-0 px-3 py-2 text-sm">{file ? "Change" : "Upload"}</span>
      <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
    </label>
  );
}
