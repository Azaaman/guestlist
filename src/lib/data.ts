// Seed data for the demo city (Austin, TX). Static content: hosts, parties,
// the members who vote on applications, and the season standings so far.
// Everything dynamic (applications, live parties, votes) lives in Supabase.

export type Gender = "man" | "woman";

export interface Host {
  id: string;
  name: string;
  bio: string;
  rating: number;
  parties: number;
  superhost: boolean;
  checklist: { item: string; done: boolean }[];
  payout: { party: string; amount: number; status: "paid" | "held" | "released" }[];
}

export interface Party {
  id: string;
  title: string;
  theme: string;
  date: string; // ISO
  neighborhood: string;
  venue: string; // venue type, used as a filter on the home page
  photo: string; // example venue photo, the real house stays hidden until approval
  address: string; // revealed only after approval + payment
  dressCode: string;
  hostId: string;
  priceUsd: number;
  basePriceUsd: number;
  spots: number;
  taken: number;
  contests: string[];
  week: number;
  live?: boolean;
}

export interface Member {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  job: string;
  bio: string;
  personality: string; // how they judge applications
  skill: string;
  badges: string[];
  rating: number;
}

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=70`;

export const SEASON = {
  name: "Season 1, Austin",
  weeks: 12,
  currentWeek: 5,
  prizes: [
    { place: 1, title: "Golden Couple", prize: "Two-week tour of Europe for two", color: "gold" },
    { place: 2, title: "Silver Couple", prize: "Hawaii getaway for two", color: "silver" },
    { place: 3, title: "Bronze Couple", prize: "Wild West camping trip for two", color: "bronze" },
  ],
  passPrice: 1499,
};

export const HOSTS: Host[] = [
  {
    id: "maya",
    name: "Maya Collins",
    bio: "Event producer, owns a hill-country house with a pool. Hosted 14 Guestlist nights.",
    rating: 4.9,
    parties: 14,
    superhost: true,
    checklist: [
      { item: "Venue photos & capacity verified", done: true },
      { item: "ID verified", done: true },
      { item: "Food & drinks for 20 guests", done: true },
      { item: "Space for 4 contests + screen for leaderboard", done: true },
      { item: "First-aid kit & exit plan", done: true },
      { item: "Music / DJ confirmed", done: false },
    ],
    payout: [
      { party: "Week 3 · Neon Disco", amount: 1120, status: "paid" },
      { party: "Week 4 · Lake Day", amount: 1260, status: "released" },
      { party: "Week 5 · Tonight", amount: 1330, status: "held" },
    ],
  },
  {
    id: "derek",
    name: "Derek Alvarez",
    bio: "Chef and home cook-off champion. East Austin loft with an open kitchen.",
    rating: 4.7,
    parties: 6,
    superhost: false,
    checklist: [
      { item: "Venue photos & capacity verified", done: true },
      { item: "ID verified", done: true },
      { item: "Food & drinks for 16 guests", done: false },
      { item: "Space for 4 contests + screen for leaderboard", done: true },
      { item: "First-aid kit & exit plan", done: true },
      { item: "Music / DJ confirmed", done: true },
    ],
    payout: [{ party: "Week 4 · Taco Duel", amount: 880, status: "paid" }],
  },
  {
    id: "priya",
    name: "Priya Shah",
    bio: "Art teacher. Converted barn studio — paint, wine, live music.",
    rating: 4.8,
    parties: 9,
    superhost: true,
    checklist: [
      { item: "Venue photos & capacity verified", done: true },
      { item: "ID verified", done: true },
      { item: "Food & drinks for 18 guests", done: true },
      { item: "Space for 4 contests + screen for leaderboard", done: true },
      { item: "First-aid kit & exit plan", done: true },
      { item: "Music / DJ confirmed", done: true },
    ],
    payout: [{ party: "Week 2 · Paint & Pour", amount: 990, status: "paid" }],
  },
];

// Party times are Austin wall-clock times (US Central, UTC-6 in winter), whatever the server's time zone.
function day(offset: number, hour = 20) {
  const [y, m, d] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/Chicago" })
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset, hour + 6)).toISOString();
}

export const PARTIES: Party[] = [
  {
    id: "tonight",
    venue: "Pool house",
    photo: photo("1544984243-ec57ea16fe25"),
    title: "Hill Country Pool Party",
    theme: "Summer-in-November pool party with a couples quiz, dance-off and cook-off",
    date: day(0, 21),
    neighborhood: "West Lake Hills",
    address: "Private house · 18 Ridgeview Dr, West Lake Hills, TX (demo address)",
    dressCode: "Smart casual + swimwear",
    hostId: "maya",
    priceUsd: 72,
    basePriceUsd: 55,
    spots: 20,
    taken: 18,
    contests: ["American History Quiz", "Dance-off", "Logic Battle", "Cooking Duel"],
    week: 5,
    live: true,
  },
  {
    id: "taco-duel-2",
    venue: "Loft kitchen",
    photo: photo("1696986681606-b156ccd761c5"),
    title: "Taco Duel Night",
    theme: "Pairs cook street tacos in 25 minutes, guests judge; trivia between rounds",
    date: day(3, 20),
    neighborhood: "East Austin",
    address: "Loft · 1200 E 6th St, Austin, TX (demo address)",
    dressCode: "Casual, bring an apron",
    hostId: "derek",
    priceUsd: 48,
    basePriceUsd: 45,
    spots: 16,
    taken: 9,
    contests: ["Cooking Duel", "American History Quiz", "Logic Battle"],
    week: 6,
  },
  {
    id: "paint-pour",
    venue: "Art barn",
    photo: photo("1527359443443-84a48aec73d2"),
    title: "Paint & Pour: Couples Canvas",
    theme: "Each pair paints one canvas together, live acoustic set, art-history trivia",
    date: day(6, 19),
    neighborhood: "Dripping Springs",
    address: "Barn studio · 400 Mercer St, Dripping Springs, TX (demo address)",
    dressCode: "Clothes you can get paint on",
    hostId: "priya",
    priceUsd: 52,
    basePriceUsd: 50,
    spots: 18,
    taken: 7,
    contests: ["Paint Together", "American History Quiz", "Dance-off"],
    week: 6,
  },
  {
    id: "neon-disco",
    venue: "Rooftop",
    photo: photo("1714381633320-e5c3fd0f14db"),
    title: "Neon Disco Rooftop",
    theme: "80s disco night: synchronized dance-off, music trivia, logic escape puzzle",
    date: day(10, 21),
    neighborhood: "Downtown",
    address: "Rooftop · 501 Congress Ave, Austin, TX (demo address)",
    dressCode: "Neon & glitter",
    hostId: "maya",
    priceUsd: 64,
    basePriceUsd: 55,
    spots: 24,
    taken: 15,
    contests: ["Dance-off", "Logic Battle", "American History Quiz"],
    week: 7,
  },
  {
    id: "lake-relay",
    venue: "Lake house",
    photo: photo("1613977257365-aaae5a9817ff"),
    title: "Lake Travis Relay Day",
    theme: "Daytime lake house: two-person swim relay, BBQ cook-off, sunset quiz",
    date: day(13, 15),
    neighborhood: "Lake Travis",
    address: "Lake house · 77 Marina Bay, Lago Vista, TX (demo address)",
    dressCode: "Swimwear + layers",
    hostId: "priya",
    priceUsd: 58,
    basePriceUsd: 55,
    spots: 20,
    taken: 4,
    contests: ["Swim Relay", "Cooking Duel", "American History Quiz"],
    week: 8,
  },
];

// Season members — they vote on new applications and fill the demo party.
export const MEMBERS: Member[] = [
  { id: "m1", name: "Sarah K.", age: 32, gender: "woman", job: "UX designer", bio: "Moved from Chicago last year, runs on coffee and salsa classes.", personality: "warm but protective of the group vibe; dislikes arrogance", skill: "Dancing", badges: ["ID verified", "8 parties"], rating: 4.9 },
  { id: "m2", name: "Jessica L.", age: 35, gender: "woman", job: "Nurse practitioner", bio: "Night shifts, weekend hikes, competitive about trivia.", personality: "practical; wants people who will actually show up and be kind", skill: "Trivia", badges: ["ID verified", "Background check", "6 parties"], rating: 4.8 },
  { id: "m3", name: "Ana R.", age: 30, gender: "woman", job: "Marketing manager", bio: "Bakes sourdough, paints badly, laughs loudly.", personality: "fun-first; says yes to playful, creative people", skill: "Painting", badges: ["ID verified", "4 parties"], rating: 4.7 },
  { id: "m4", name: "Rachel T.", age: 38, gender: "woman", job: "Attorney", bio: "Divorced, two dogs, finally has Friday nights free.", personality: "skeptical; red flags are an instant no", skill: "Logic", badges: ["ID verified", "Background check", "9 parties"], rating: 5.0 },
  { id: "m5", name: "Emily W.", age: 33, gender: "woman", job: "Teacher", bio: "History nerd, karaoke regular.", personality: "values curiosity and good manners", skill: "Trivia", badges: ["ID verified", "5 parties"], rating: 4.9 },
  { id: "m6", name: "Jake M.", age: 33, gender: "man", job: "Software engineer", bio: "New in Austin, learning to cook brisket.", personality: "easygoing; likes people who bring energy", skill: "Cooking", badges: ["ID verified", "3 parties"], rating: 4.6 },
  { id: "m7", name: "Marcus D.", age: 36, gender: "man", job: "Firefighter", bio: "Swims every morning, terrible dancer, great teammate.", personality: "looks for respect and team spirit", skill: "Swimming", badges: ["ID verified", "Background check", "7 parties"], rating: 4.9 },
  { id: "m8", name: "Daniel P.", age: 31, gender: "man", job: "Product manager", bio: "Board-game collector, escape-room record holder.", personality: "analytical; wants thoughtful answers, not one-liners", skill: "Logic", badges: ["ID verified", "5 parties"], rating: 4.7 },
  { id: "m9", name: "Chris B.", age: 39, gender: "man", job: "Architect", bio: "Sketches everything, cooks Italian on Sundays.", personality: "relaxed but protective of the women in the group", skill: "Painting", badges: ["ID verified", "8 parties"], rating: 4.8 },
  { id: "m10", name: "Tyler G.", age: 34, gender: "man", job: "Sales lead", bio: "Two-step champion of his office.", personality: "social; likes confident, friendly people", skill: "Dancing", badges: ["ID verified", "4 parties"], rating: 4.6 },
];

export interface SeasonPair {
  id: string;
  name: string;
  members: [string, string];
  weeks: number[]; // points per week
}

export const SEASON_PAIRS: SeasonPair[] = [
  { id: "p1", name: "The Two-Steppers", members: ["Sarah K.", "Tyler G."], weeks: [62, 71, 58, 80] },
  { id: "p2", name: "Brain & Brawn", members: ["Rachel T.", "Marcus D."], weeks: [70, 55, 77, 66] },
  { id: "p3", name: "History Buffs", members: ["Emily W.", "Daniel P."], weeks: [81, 60, 52, 73] },
  { id: "p4", name: "Brush Strokes", members: ["Ana R.", "Chris B."], weeks: [49, 76, 66, 61] },
  { id: "p5", name: "Night Shift", members: ["Jessica L.", "Jake M."], weeks: [55, 58, 71, 60] },
  { id: "p6", name: "Salt & Pepper", members: ["Olivia N.", "Ben S."], weeks: [44, 63, 59, 57] },
  { id: "p7", name: "Lone Stars", members: ["Megan H.", "Ryan C."], weeks: [60, 41, 55, 62] },
  { id: "p8", name: "Plot Twist", members: ["Lauren F.", "Kevin O."], weeks: [38, 52, 61, 49] },
];

export const CONTEST_SKILLS = ["Trivia", "Logic", "Dancing", "Cooking", "Painting", "Swimming"];

export function getParty(id: string) {
  return PARTIES.find((p) => p.id === id);
}
export function getHost(id: string) {
  return HOSTS.find((h) => h.id === id);
}
export function spotsLeft(p: Party) {
  return Math.max(0, p.spots - p.taken);
}
// Dynamic pricing: price rises as the party fills up.
export function dynamicPrice(p: Party) {
  const fill = p.taken / p.spots;
  return Math.round(p.basePriceUsd * (1 + Math.max(0, fill - 0.5) * 0.7));
}
