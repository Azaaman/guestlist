import { SEASON } from "@/lib/data";
import PassCheckout from "./PassCheckout";

const perks = [
  ["A seat at every party", `All ${SEASON.weeks} nights of the season, no fighting for the last spots.`],
  ["Priority approval", "Pass holders are reviewed first, and most are approved once for the whole season."],
  ["Your place in the race", "Only pass holders collect season points and can win the three trips."],
  ["Food, drinks and the house", "Included every night. Per party it works out cheaper than single tickets at peak price."],
];

export default function PassPage() {
  const perNight = Math.round(SEASON.passPrice / SEASON.weeks);
  return (
    <div className="glow">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-6xl sm:text-7xl">Season Pass</h1>
          <p className="mt-4 max-w-md text-lg text-white/80">One payment for the whole of {SEASON.name}. About ${perNight} a night, with the trips to play for.</p>
          <ul className="mt-8">
            {perks.map(([t, d]) => (
              <li key={t} className="border-t border-line py-4">
                <div className="text-lg font-bold">{t}</div>
                <p className="text-white/70">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <PassCheckout price={SEASON.passPrice} season={SEASON.name} weeks={SEASON.weeks} />
      </div>
    </div>
  );
}
