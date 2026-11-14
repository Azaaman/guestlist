import { SEASON } from "@/lib/data";
import PassCheckout from "./PassCheckout";

const perks = [
  ["Every party is paid for", `All ${SEASON.weeks} nights of the season. You book in one tap and pay nothing more.`],
  ["Front of every waitlist", "When a party is full for you, pass holders are placed ahead of everyone without a pass."],
  ["Entered to win a trip", "Every pass holder is in the finale prize draw for Europe, Hawaii and the Wild West."],
  ["Food, drinks and the house", "Included every night. Per party it works out cheaper than single tickets at peak price."],
];

export default function PassPage() {
  const perNight = Math.round(SEASON.passPrice / SEASON.weeks);
  return (
    <div className="glow">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-5xl sm:text-6xl">Season Pass</h1>
          <p className="mt-4 max-w-md text-lg text-white/80">One payment for the whole of {SEASON.name}. About ${perNight} a night, and a chance to win one of three trips.</p>
          <ul className="mt-8">
            {perks.map(([t, d]) => (
              <li key={t} className="reveal border-t border-line py-4">
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
