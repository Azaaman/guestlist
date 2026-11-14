import Link from "next/link";
import { SEASON } from "@/lib/data";

const steps = [
  ["Buy a Season Pass", `One payment of $${SEASON.passPrice} covers all ${SEASON.weeks} parties of the season.`],
  ["You are entered automatically", "Every pass holder gets one entry. There is nothing to collect and no points to track."],
  ["Winners are drawn at the finale", "At the last party of the season, three pass holders are drawn live. Each winner brings a guest."],
];

export default function Prizes() {
  const medal = ["text-gold", "text-silver", "text-bronze"];
  return (
    <div className="glow">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-4xl sm:text-6xl">Three trips for pass holders</h1>
        <p className="mt-4 max-w-xl text-lg text-white/80">{SEASON.name}. Hold a Season Pass and you are in the draw for all three.</p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {SEASON.prizes.map((p, i) => (
            <li key={p.place} className="reveal card p-6" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className={`font-semibold ${medal[i]}`}>{p.title}</div>
              <div className="display mt-2 text-2xl">{p.prize}</div>
            </li>
          ))}
        </ul>

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
          <Link href="/pass" className="btn btn-primary">Get the Season Pass, <span className="ml-1">${SEASON.passPrice}</span></Link>
          <span className="text-sm text-white/65">Contests at the parties are just for the night. They do not affect the draw.</span>
        </div>
      </div>
    </div>
  );
}
