// Shared between server and client: the rules of a party room.

export const REPORT_REASONS = ["Harassment or unwanted contact", "Aggressive behaviour or a threat", "Too drunk to be safe", "Something else"];
// A guest is removed from the party after this many different guests report them, or when the host confirms
// one report. A moderator then decides whether the ban is permanent; the guest can appeal first.
export const REPORTS_TO_BAN = 3;
export const PAYOUT_THRESHOLD = 4.2;
export const INTERESTS = ["Music", "Food", "Art", "Outdoors", "Games", "Travel"];

// Season Pass refund when a holder is banned: the unused parties are refunded, minus a fixed conduct fee.
export const CONDUCT_FEE = 100;
export function passRefund(passPrice: number, weeks: number, currentWeek: number) {
  const unused = Math.max(0, weeks - (currentWeek - 1));
  const unusedValue = Math.round((passPrice * unused) / weeks);
  return { unused, unusedValue, fee: CONDUCT_FEE, refund: Math.max(0, unusedValue - CONDUCT_FEE) };
}

// Refundable damage deposit, held on the card with every booking and released after the party.
export const DEPOSIT = 150;
// A booking can be cancelled for a full refund until this many hours before the party.
export const CANCEL_HOURS = 24;
// Share of ticket revenue that goes to the host.
export const HOST_SHARE = 0.5;
