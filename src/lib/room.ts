// Shared between server and client: the rules of a party room.

export const REPORT_REASONS = ["Harassment or unwanted contact", "Aggressive behaviour", "Too drunk to be safe", "Something else"];
// A guest is banned for good after this many different guests report them, or when the host confirms one report.
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
