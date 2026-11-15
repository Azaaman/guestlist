import Link from "next/link";
import { SEASON } from "@/lib/data";

const steps = [
  ["Buy a Season Pass", `One payment of $${SEASON.passPrice} covers the ticket for all ${SEASON.weeks} parties of the season.`],
  ["You are entered automatically", "Every pass holder gets one entry. There is nothing to collect and no points to track."],
  ["Winners are drawn at the finale", `At the last party of the season, ${SEASON.prizeCount} pass holders are drawn live. Each wins ${SEASON.prize}: bring a friend.`],
];

export default function Prizes() {
  return (
    <div className="glow">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl sm:text-6xl">Win a trip to Hawaii</h1>
        <p className="mt-4 max-w-xl text-lg text-white/80">{SEASON.name}. Every Season Pass holder is in the draw at the end of the season.</p>

        <div className="reveal card mt-10 flex flex-col items-center gap-2 p-8 text-center sm:flex-row sm:gap-8 sm:text-left">
          <div className="text-6xl" aria-hidden>✈️</div>
          <div className="flex-1">
            <div className="display text-3xl">A trip to Hawaii for two</div>
            <p className="mt-1 text-white/75">Flights and a week&apos;s stay. Each winner brings a friend.</p>
          </div>
          <div className="text-center">
            <div className="display price text-6xl">{SEASON.prizeCount}</div>
            <div className="text-sm font-semibold text-white/70">winners</div>
          </div>
        </div>
        <p className="reveal mt-4 rounded-xl border border-line p-4 text-white/85"><span className="font-semibold text-hi">When:</span> the draw happens once, at the end of the season, during the week {SEASON.weeks} finale party.</p>

        <h2 className="reveal mt-14 text-3xl">How the draw works</h2>
        <ol className="mt-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="reveal flex gap-4 border-t border-line py-5">
              <span className="display text-3xl text-brand-2">{i + 1}</span>
              <div>
                <div className="text-lg font-semibold">{t}</div>
                <p className="mt-1 text-white/75">{d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="reveal mt-8 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center">
          <Link href="/pass" className="btn btn-primary">Get the Season Pass, ${SEASON.passPrice}</Link>
          <span className="text-sm text-white/65">One entry per pass holder.</span>
        </div>
      </div>
    </div>
  );
}
