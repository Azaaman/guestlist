// Seed data for the demo city (Austin, TX). Static content: hosts, parties,
// and the members who vote on applications.
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
    { place: 1, title: "Grand prize", prize: "Two-week tour of Europe for two", color: "gold" },
    { place: 2, title: "Second prize", prize: "Hawaii getaway for two", color: "silver" },
    { place: 3, title: "Third prize", prize: "Wild West camping trip for two", color: "bronze" },
  ],
  passPrice: 499,
};

export const HOSTS: Host[] = [
  {
    id: "maya",
    name: "Maya Collins",
    bio: "Event producer, owns a hill-country house with a pool. Hosted 14 Nestly nights.",
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
  {
    id: "garden-lights",
    venue: "Garden",
    photo: photo("1546373702-eb3e6f769df2"),
    title: "Backyard Trivia Under the Lights",
    theme: "String lights, fire pit and a couples trivia league in a big East Side garden",
    date: day(17, 20),
    neighborhood: "Hyde Park",
    address: "Garden house · 4310 Avenue G, Austin, TX (demo address)",
    dressCode: "Casual, bring a jacket",
    hostId: "derek",
    priceUsd: 45,
    basePriceUsd: 45,
    spots: 18,
    taken: 5,
    contests: ["American History Quiz", "Logic Battle", "Cooking Duel"],
    week: 8,
  },
  {
    id: "glass-house",
    venue: "Glass house",
    photo: photo("1505843513577-22bb7d21e455"),
    title: "Glass House Game Night",
    theme: "Modern glass house, escape-room puzzles for two and a late dance-off",
    date: day(20, 20),
    neighborhood: "Barton Hills",
    address: "Glass house · 2204 Trailside Dr, Austin, TX (demo address)",
    dressCode: "All black",
    hostId: "maya",
    priceUsd: 60,
    basePriceUsd: 55,
    spots: 20,
    taken: 12,
    contests: ["Logic Battle", "Dance-off", "Paint Together"],
    week: 9,
  },
  {
    id: "villa-sunset",
    venue: "Villa",
    photo: photo("1613977257363-707ba9348227"),
    title: "Villa Sunset Cook-off",
    theme: "White villa with a terrace: sunset cook-off for couples and a pool relay",
    date: day(24, 18),
    neighborhood: "Spicewood",
    address: "Villa · 915 Paleface Ranch Rd, Spicewood, TX (demo address)",
    dressCode: "Linen and light colours",
    hostId: "priya",
    priceUsd: 62,
    basePriceUsd: 55,
    spots: 22,
    taken: 13,
    contests: ["Cooking Duel", "Swim Relay", "Dance-off"],
    week: 9,
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
