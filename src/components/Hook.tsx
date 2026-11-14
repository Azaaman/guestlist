"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

export interface HookParty {
  id: string;
  title: string;
  when: string;
  place: string;
  price: number;
  left: number;
  photo: string;
  venue: string;
  contests: string[];
  live: boolean;
}

// Free Pexels clip (Ramon Martinez): aerial of a villa with a pool. Shown for tonight's pool party.
const VIDEO = "https://videos.pexels.com/video-files/16580831/16580831-hd_1920_1080_30fps.mp4";

const VENUE_ICON: Record<string, string> = { "Pool house": "🏊", "Loft kitchen": "🍳", "Art barn": "🎨", Rooftop: "🌆", "Lake house": "🛶" };
const CONTEST_ICON: Record<string, string> = {
  "American History Quiz": "🇺🇸", "Dance-off": "💃", "Logic Battle": "🧩", "Cooking Duel": "👩‍🍳", "Paint Together": "🖌️", "Swim Relay": "🏅",
};

export default function Hook({ parties }: { parties: HookParty[] }) {
  const [id, setId] = useState(parties[0].id);
  const [filter, setFilter] = useState<string | null>(null);
  const [videoOk, setVideoOk] = useState(true);
  const [photoOk, setPhotoOk] = useState(true);
  const root = useRef<HTMLElement>(null);
  const party = parties.find((p) => p.id === id) ?? parties[0];

  const venues = useMemo(() => parties.map((p) => ({ label: p.venue, id: p.id })), [parties]);
  const contests = useMemo(() => [...new Set(parties.flatMap((p) => p.contests))], [parties]);

  // Scroll progress (0 → 1 over the first 500px) drives the marquee shift and the media zoom.
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = Math.max(0, Math.min(1, window.scrollY / 500));
        root.current?.style.setProperty("--p", p.toFixed(3));
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => setPhotoOk(true), [id]);

  function pickContest(c: string) {
    setFilter(c);
    const matches = parties.filter((p) => p.contests.includes(c));
    const next = matches.find((p) => p.id !== id) ?? matches[0];
    if (next) setId(next.id);
  }

  const venueChips = venues.map((v) => (
    <button key={v.id} type="button" className="chip" aria-pressed={v.id === id} onClick={() => { setFilter(null); setId(v.id); }}>
      <span aria-hidden>{VENUE_ICON[v.label] ?? "🏠"}</span>{v.label}
    </button>
  ));
  const contestChips = contests.map((c) => (
    <button key={c} type="button" className="chip" aria-pressed={filter === c} onClick={() => pickContest(c)}>
      <span aria-hidden>{CONTEST_ICON[c] ?? "🎲"}</span>{c}
    </button>
  ));

  return (
    <section ref={root} className="glow overflow-hidden pb-14 pt-10 sm:pt-16">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h1 className="text-5xl sm:text-7xl">Get on the list.</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-white/85">Secret house parties. Pick a vibe.</p>
      </div>

      <div className="marquee mt-8 space-y-3" aria-label="Filter parties by place or contest">
        <div className="marquee-shift" style={{ ["--dir" as string]: -1 }}>
          <div className="marquee-track px-2">{venueChips}{venueChips.map((c, i) => <span key={`a${i}`} aria-hidden className="contents">{c}</span>)}{venueChips.map((c, i) => <span key={`b${i}`} aria-hidden className="contents">{c}</span>)}{venueChips.map((c, i) => <span key={`c${i}`} aria-hidden className="contents">{c}</span>)}</div>
        </div>
        <div className="marquee-shift" style={{ ["--dir" as string]: 1 }}>
          <div className="marquee-track rev px-2">{contestChips}{contestChips.map((c, i) => <span key={`a${i}`} aria-hidden className="contents">{c}</span>)}{contestChips.map((c, i) => <span key={`b${i}`} aria-hidden className="contents">{c}</span>)}{contestChips.map((c, i) => <span key={`c${i}`} aria-hidden className="contents">{c}</span>)}</div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-5xl px-4">
        <div className="hero-media relative aspect-[4/5] overflow-hidden bg-night sm:aspect-[16/9]">
          <div key={party.id} className="fadein absolute inset-0 bg-gradient-to-br from-brand via-night to-panel">
            {party.live && videoOk ? (
              <video className="h-full w-full object-cover" src={VIDEO} poster={party.photo} autoPlay muted loop playsInline preload="metadata" onError={() => setVideoOk(false)} aria-label="Aerial video of a house with a pool" />
            ) : photoOk ? (
              <img src={party.photo} alt={`Example of a ${party.venue.toLowerCase()} venue`} onError={() => setPhotoOk(false)} className="kenburns h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#17103f]/85 via-transparent to-transparent" />
          <div key={`${party.id}-card`} className="fadein absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 text-left sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 text-sm font-semibold">
                <span>{party.when}</span>
                {party.live && <span className="inline-flex items-center gap-1.5 text-hot"><span className="live-dot h-2 w-2 rounded-full bg-hot" />Live</span>}
              </div>
              <div className="display mt-1 text-2xl sm:text-4xl">{party.title}</div>
              <div className="mt-1 text-white/85">{party.place}, {party.left} spots left</div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="display price text-4xl">${party.price}</div>
              <Link href={`/parties/${party.id}`} className="btn btn-primary">See this party</Link>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-white/60">Example footage. The real house is revealed after members approve you.</p>
      </div>
    </section>
  );
}
