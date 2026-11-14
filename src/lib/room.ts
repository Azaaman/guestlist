// Shared between server and client: the rules of a party room.

export const REPORT_REASONS = ["Harassment or unwanted contact", "Aggressive behaviour", "Too drunk to be safe", "Something else"];
// A guest is banned for good after this many different guests report them, or when the host confirms one report.
export const REPORTS_TO_BAN = 3;
export const PAYOUT_THRESHOLD = 4.2;
export const INTERESTS = ["Music", "Food", "Art", "Outdoors", "Games", "Travel"];
