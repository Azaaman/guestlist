"use client";
// Home page hero: two moving rows of filters (place, vibe) that switch the featured party.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Countdown from "@/components/Countdown";

export interface HookParty {
  id: string;
  title: string;
  date: string;
  when: string;
  place: string;
  price: number;
  left: number;
  photo: string;
  venue: string;
  dressCode: string;
  vibes: string[];
  live: boolean;
}

// Free Pexels clip (Ramon Martinez): aerial of a villa with a pool. Shown for tonight's pool party.
const VIDEO = "https://videos.pexels.com/video-files/16580831/16580831-hd_1920_1080_30fps.mp4";

const VENUE_ICON: Record<string, string> = {
  "Pool house": "🏊",
  "Loft kitchen": "🍳",
  "Art studio": "🎨",
  Rooftop: "🌆",
  "Bay house": "🛶",
  Garden: "🌿",
  "Glass house": "🪟",
  Villa: "🏛️",
};
const VIBE_ICON: Record<string, string> = {
  Pool: "💦",
  Dancing: "💃",
  "Late night": "🌙",
  Foodie: "🍽️",
  Chill: "🛋️",
  "Small group": "👥",
  Artsy: "🖌️",
  "Live music": "🎸",
  "Dress-up": "✨",
  Outdoors: "🌲",
  Daytime: "☀️",
};

export default function Hook({ parties }: { parties: HookParty[] }) {
  const [id, setId] = useState(parties[0].id);
  // Which single chip is lit: "v0:<party id>" or "c0:<vibe>". The marquee repeats its chips, so the copy index matters.
  const [lit, setLit] = useState<string>(`v0:${parties[0].id}`);
  const [videoOk, setVideoOk] = useState(true);
  const [photoOk, setPhotoOk] = useState(true);
  const root = useRef<HTMLElement>(null);
  const party = parties.find((p) => p.id === id) ?? parties[0];

  const venues = useMemo(() => parties.map((p) => ({ label: p.venue, id: p.id })), [parties]);
  const vibes = useMemo(() => [...new Set(parties.flatMap((p) => p.vibes))], [parties]);

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

  function pickVibe(c: string, key: string) {
    setLit(key);
    const matches = parties.filter((p) => p.vibes.includes(c));
    const next = matches.find((p) => p.id !== id) ?? matches[0];
    if (next) setId(next.id);
  }

  const COPIES = [0, 1, 2, 3];
  const venueChips = COPIES.flatMap((n) =>
    venues.map((v) => {
      const key = `v${n}:${v.id}`;
      return (
        <button
          key={key}
          type="button"
          className="chip"
          aria-pressed={lit === key}
          tabIndex={n === 0 ? 0 : -1}
          onClick={() => {
            setLit(key);
            setId(v.id);
          }}
        >
          <span aria-hidden>{VENUE_ICON[v.label] ?? "🏠"}</span>
          {v.label}
        </button>
      );
    }),
  );
  const vibeChips = COPIES.flatMap((n) =>
    vibes.map((c) => {
      const key = `c${n}:${c}`;
      return (
        <button
          key={key}
          type="button"
          className="chip"
          aria-pressed={lit === key}
          tabIndex={n === 0 ? 0 : -1}
          onClick={() => pickVibe(c, key)}
        >
          <span aria-hidden>{VIBE_ICON[c] ?? "🎉"}</span>
          {c}
        </button>
      );
    }),
  );

  return (
    <section ref={root} className="glow overflow-hidden pb-14 pt-10 sm:pt-16">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h1 className="text-5xl sm:text-7xl">Get on the list.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
          Make new friends at secret house parties in Miami. Every guest is verified, and at the door you get
          three people to meet. Pick a place or a vibe for your next night out.
        </p>
      </div>

      <div className="marquee mt-8 space-y-3" aria-label="Filter parties by place or vibe">
        <div className="marquee-shift" style={{ ["--dir" as string]: -1 }}>
          <div className="marquee-track px-2">{venueChips}</div>
        </div>
        <div className="marquee-shift" style={{ ["--dir" as string]: 1 }}>
          <div className="marquee-track rev px-2">{vibeChips}</div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-5xl px-4">
        <div className="hero-media relative aspect-[4/5] overflow-hidden bg-night sm:aspect-[16/9]">
          <div
            key={party.id}
            className="fadein absolute inset-0 bg-gradient-to-br from-brand via-night to-panel"
          >
            {party.live && videoOk ? (
              <video
                className="h-full w-full object-cover"
                src={VIDEO}
                poster={party.photo}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => setVideoOk(false)}
                aria-label="Aerial video of a house with a pool"
              />
            ) : photoOk ? (
              <img
                src={party.photo}
                alt={`Example of a ${party.venue.toLowerCase()} venue`}
                onError={() => setPhotoOk(false)}
                className="kenburns h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#17103f]/85 via-transparent to-transparent" />
          <div
            key={`${party.id}-card`}
            className="fadein absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 text-left sm:flex-row sm:items-end sm:justify-between sm:p-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 text-sm font-semibold">
                <span>{party.when}</span>
                {party.live && (
                  <span className="inline-flex items-center gap-1.5 text-hot">
                    <span className="live-dot h-2 w-2 rounded-full bg-hot" />
                    Live
                  </span>
                )}
              </div>
              <div className="display mt-1 text-2xl sm:text-4xl">{party.title}</div>
              <div className="mt-1 text-white/85">
                {party.place}, {party.left === 0 ? "full, waitlist open" : `${party.left} spots left`}
              </div>
              <div className="mt-2 mr-2 inline-block rounded-full bg-hi px-3 py-1 text-sm font-bold text-[#17103f]">
                <span aria-hidden>🤵👗 </span>Dress code: {party.dressCode}
              </div>
              <Countdown
                to={party.date}
                className="mt-2 inline-block rounded-full bg-black/40 px-3 py-1 text-sm font-semibold text-hi backdrop-blur"
              />
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="display price text-4xl">${party.price}</div>
              <Link href={`/parties/${party.id}`} className="btn btn-primary">
                See this party
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-white/60">
          Example footage. The real house is shown once you book.
        </p>
      </div>
    </section>
  );
}
