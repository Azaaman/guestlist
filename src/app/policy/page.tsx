import Link from "next/link";
import { SEASON } from "@/lib/data";
import { CONDUCT_FEE, PAYOUT_THRESHOLD, REPORTS_TO_BAN, passRefund } from "@/lib/room";

export const metadata = { title: "House rules, Nestly" };

export default function Policy() {
  const r = passRefund(SEASON.passPrice, SEASON.weeks, SEASON.currentWeek);
  const sections: [string, string[]][] = [
    ["1. Who can join", [
      "Nestly is for adults aged 25 to 45.",
      "You create one profile. It is screened by AI and then read by a human moderator. Only verified guests can book a party.",
      "If you edit your profile, it is screened again.",
    ]],
    ["2. Booking a party", [
      "A verified guest books any party with a free place. There is no vote and no application per party.",
      "The address is shown only after you have a ticket.",
      "If the party is full for you, you join the waitlist and nothing is charged.",
    ]],
    ["3. Prices", [
      "Ticket prices rise as a party fills up: the fewer places left, the higher the price.",
      "The price you see when you book is the price you pay.",
    ]],
    ["4. Balance of men and women", [
      "Every party is kept between 40/60 and 60/40. Neither men nor women can take more than 60% of the places.",
      "When the places for your group are taken, you can only join the waitlist, even if the party is not full.",
    ]],
    [`5. Season Pass, $${SEASON.passPrice}`, [
      `One payment covers all ${SEASON.weeks} parties of the season. You still book each party; it just costs nothing.`,
      "Pass holders go to the front of every waitlist, ahead of guests without a pass.",
      "A pass does not override the balance rule or a full house.",
      "Every pass holder is entered in the end-of-season draw for three trips.",
    ]],
    ["6. Behaviour, reports and bans", [
      "Respect, consent and no harassment. Hosts and guests are held to the same rules.",
      "During a party any guest can privately report another guest. The host reviews the report on the spot.",
      `A guest is banned permanently when ${REPORTS_TO_BAN} different guests report them, or when the host confirms one report.`,
      "A banned guest is removed from the party at once and can never book or check in again. The ban is tied to their ID.",
    ]],
    ["7. Refunds and the conduct fee", [
      "Cancel a ticket up to 24 hours before the party for a full refund. After that the ticket is not refunded.",
      "If you are banned, the ticket for that night is not refunded.",
      `If you hold a Season Pass and are banned, the pass is cancelled. The parties you have not used are refunded, minus a $${CONDUCT_FEE} conduct fee.`,
      `Example today, in week ${SEASON.currentWeek} of ${SEASON.weeks}: ${r.unused} unused parties are worth $${r.unusedValue}. Minus the $${CONDUCT_FEE} fee, $${r.refund} goes back to the card.`,
    ]],
    ["8. Hosts", [
      "Hosts are ID-checked and their venue is inspected before the first party.",
      `Guests rate the host after each party. The host is paid only when the rating is ${PAYOUT_THRESHOLD} or higher.`,
    ]],
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl sm:text-5xl">House rules</h1>
      <p className="mt-4 text-lg text-white/80">How Nestly works, what you agree to when you join, and what happens when someone breaks the rules.</p>
      {sections.map(([title, lines]) => (
        <section key={title} className="reveal mt-10">
          <h2 className="text-2xl">{title}</h2>
          <ul className="mt-3">
            {lines.map((l) => <li key={l} className="border-t border-line py-3 text-white/85">{l}</li>)}
          </ul>
        </section>
      ))}
      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link href="/profile" className="btn btn-primary">Create my profile</Link>
        <Link href="/parties" className="btn btn-ghost">See the parties</Link>
      </div>
    </div>
  );
}
