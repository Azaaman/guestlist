import Link from "next/link";
import { SEASON } from "@/lib/data";
import { CANCEL_HOURS, CONDUCT_FEE, DEPOSIT, HOST_SHARE, PAYOUT_THRESHOLD, REPORTS_TO_BAN, passRefund } from "@/lib/room";

export const metadata = { title: "House rules, Nestly" };

export default function Policy() {
  const r = passRefund(SEASON.passPrice, SEASON.weeks, SEASON.currentWeek);
  const sections: [string, string[]][] = [
    ["1. Who can join", [
      "Nestly is for adults aged 25 to 45.",
      "You create one profile. AI screens it and either verifies or rejects it. Only verified guests can book a party.",
      "Human moderators do not read new profiles. They deal with reports from parties.",
      "If you edit your profile, it is screened again.",
    ]],
    ["2. Booking a party", [
      "A verified guest books any party with a free place. There is no vote and no application per party.",
      `Booking places one hold on your card: the ticket price plus a $${DEPOSIT} damage deposit. Nothing is charged at that moment.`,
      "After the party the ticket is charged and the deposit is released.",
      "The address is shown only after you have a ticket.",
      "Anyone can book, whatever their gender. If the party is full, you join the waitlist and no card is needed.",
    ]],
    ["3. Prices", [
      "Ticket prices rise as a party fills up: the fewer places left, the higher the price.",
      "The price you see when you book is the price you pay.",
    ]],
    [`4. Season Pass, $${SEASON.passPrice}`, [
      `One payment covers the ticket for all ${SEASON.weeks} parties of the season. You still book each party, and the damage deposit is still held.`,
      "Pass holders go to the front of every waitlist. A pass holder who joins a waitlist is placed ahead of every guest without a pass, even those who joined earlier.",
      "Guarantee: if you could not get a place at 8 or more parties in the season despite trying, the difference is refunded in proportion.",
      `Every pass holder is entered in the end-of-season draw. ${SEASON.prizeCount} winners each get ${SEASON.prize}.`,
    ]],
    ["5. Cancelling and no-shows", [
      `Cancel up to ${CANCEL_HOURS} hours before the party and the hold on your card is released in full.`,
      `Inside ${CANCEL_HOURS} hours a booking cannot be cancelled.`,
      "If you booked and did not come, the ticket is charged anyway. The deposit is released.",
      "If the host cancels, every guest is refunded in full and the host pays a cancellation fee.",
    ]],
    ["6. Damage to the house", [
      `If you break or damage something, the host files a claim on the night. Up to $${DEPOSIT} is taken from your deposit.`,
      "Damage above the deposit is covered by Nestly's host protection, so the host is never left out of pocket. Nestly may recover that amount from the guest.",
      "You can dispute a claim with Nestly within 48 hours. Refusing to pay for damage you caused leads to a ban.",
    ]],
    ["7. Behaviour and reports", [
      "Respect, consent and no harassment. Hosts and guests are held to the same rules.",
      "During a party any guest can privately report another guest. The host reviews the report on the spot.",
      `A guest is removed from the party when ${REPORTS_TO_BAN} different guests report them, or when the host confirms one report.`,
      "Removal is not yet a ban. A Nestly moderator reviews every case, and the removed guest can send their side first. The moderator then clears the guest or bans them permanently.",
      "A report about the host goes straight to Nestly. The host does not see it.",
      "Knowingly false reports are a breach of these rules.",
      "If anyone is in danger, call 911 first. Violence and threats are reported to the police, not only to Nestly.",
    ]],
    ["8. Bans and refunds", [
      "A permanently banned guest can never book or check in again.",
      "If you are removed from a party, the ticket for that night is not refunded.",
      `If you hold a Season Pass and are banned, the pass is cancelled. The parties you have not used are refunded, minus a $${CONDUCT_FEE} conduct fee.`,
      `Example today, in week ${SEASON.currentWeek} of ${SEASON.weeks}: ${r.unused} unused parties are worth $${r.unusedValue}. Minus the $${CONDUCT_FEE} fee, $${r.refund} goes back to the card.`,
    ]],
    ["9. Safety at the house", [
      "Nestly buys event liability insurance for every party.",
      "Hosts set an alcohol limit, close the pool at 11 pm and stop the music at 11 pm.",
      "Guest numbers never exceed the capacity checked for that house.",
    ]],
    ["10. Hosts", [
      "To host, you apply with your ID, proof that you own the house or may host there, and photos of the house. A Nestly moderator checks them before your first party.",
      "Hosts choose the theme and name of their night from Nestly's list.",
      "No cameras inside the house. Outdoor cameras must be disclosed and record no sound.",
      `Hosts keep ${HOST_SHARE * 100}% of ticket revenue.`,
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
