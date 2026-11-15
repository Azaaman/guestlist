// Seed data for the demo city (Miami, FL). Static content: hosts, parties,
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
  men: number; // seeded bookings so far (no gender quota: anyone can book)
  women: number;
  waitlist: number; // seeded guests already waiting (none of them pass holders)
  vibes: string[]; // what the night feels like, used as filters on the home page
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
  into: string;
  badges: string[];
  rating: number;
}

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=70`;

export const SEASON = {
  name: "Season 1, Miami",
  weeks: 12,
  currentWeek: 5,
  // Three equal prizes, drawn among Season Pass holders at the finale.
  prize: "a trip to Hawaii for two",
  prizeCount: 3,
  passPrice: 499,
};

export const HOSTS: Host[] = [
  {
    id: "maya",
    name: "Maya Collins",
    bio: "Event producer, owns a Coral Gables house with a pool. Hosted 14 Nestly nights.",
    rating: 4.9,
    parties: 14,
    superhost: true,
    checklist: [
      { item: "Venue photos & capacity verified", done: true },
      { item: "Verified", done: true },
      { item: "Food & drinks for 20 guests", done: true },
      { item: "Screen for the guest wall", done: true },
      { item: "First-aid kit & exit plan", done: true },
      { item: "Alcohol limit set, pool closed after 11 pm", done: true },
      { item: "Music off by 11 pm (quiet hours)", done: false },
    ],
    payout: [
      { party: "Week 3 · Neon Disco", amount: 800, status: "paid" },
      { party: "Week 4 · Bay Day", amount: 900, status: "released" },
      { party: "Week 5 · Tonight", amount: 950, status: "held" },
    ],
  },
  {
    id: "derek",
    name: "Derek Alvarez",
    bio: "Chef. Wynwood loft with an open kitchen and one long table.",
    rating: 4.7,
    parties: 6,
    superhost: false,
    checklist: [
      { item: "Venue photos & capacity verified", done: true },
      { item: "Verified", done: true },
      { item: "Food & drinks for 16 guests", done: false },
      { item: "Screen for the guest wall", done: true },
      { item: "First-aid kit & exit plan", done: true },
      { item: "Alcohol limit set, pool closed after 11 pm", done: true },
      { item: "Music off by 11 pm (quiet hours)", done: true },
    ],
    payout: [{ party: "Week 4 · Taco Table", amount: 630, status: "paid" }],
  },
  {
    id: "priya",
    name: "Priya Shah",
    bio: "Art teacher. Converted warehouse studio in Little Haiti: paint, wine, live music.",
    rating: 4.8,
    parties: 9,
    superhost: true,
    checklist: [
      { item: "Venue photos & capacity verified", done: true },
      { item: "Verified", done: true },
      { item: "Food & drinks for 18 guests", done: true },
      { item: "Screen for the guest wall", done: true },
      { item: "First-aid kit & exit plan", done: true },
      { item: "Alcohol limit set, pool closed after 11 pm", done: true },
      { item: "Music off by 11 pm (quiet hours)", done: true },
    ],
    payout: [{ party: "Week 2 · Paint & Pour", amount: 700, status: "paid" }],
  },
];

// Party times are Miami wall-clock times (US Eastern, UTC-5 in winter), whatever the server's time zone.
function day(offset: number, hour = 20) {
  const [y, m, d] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/New_York" })
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset, hour + 5)).toISOString();
}

export const PARTIES: Party[] = [
  {
    id: "tonight",
    venue: "Pool house",
    photo: photo("1544984243-ec57ea16fe25"),
    title: "Coral Gables Pool Party",
    theme: "Summer-in-November pool party: grill, a DJ on the terrace and a heated pool",
    date: day(0, 21),
    neighborhood: "Coral Gables",
    address: "Private house · 1420 Alhambra Cir, Coral Gables, FL (demo address)",
    dressCode: "Smart casual + swimwear",
    hostId: "maya",
    priceUsd: 72,
    basePriceUsd: 55,
    spots: 20,
    men: 10,
    women: 8,
    waitlist: 0,
    vibes: ["Pool", "Dancing", "Late night"],
    week: 5,
    live: true,
  },
  {
    id: "taco-duel-2",
    venue: "Loft kitchen",
    photo: photo("1696986681606-b156ccd761c5"),
    title: "Taco Table Night",
    theme: "Open-kitchen loft where the host cooks street tacos and everyone eats at one long table",
    date: day(3, 20),
    neighborhood: "Wynwood",
    address: "Loft · 250 NW 24th St, Miami, FL (demo address)",
    dressCode: "Casual",
    hostId: "derek",
    priceUsd: 48,
    basePriceUsd: 45,
    spots: 16,
    men: 5,
    women: 4,
    waitlist: 0,
    vibes: ["Foodie", "Chill", "Small group"],
    week: 6,
  },
  {
    id: "paint-pour",
    venue: "Art studio",
    photo: photo("1527359443443-84a48aec73d2"),
    title: "Paint & Pour",
    theme: "Warehouse art studio with wine, canvases to mess around on and a live acoustic set",
    date: day(6, 19),
    neighborhood: "Little Haiti",
    address: "Studio · 6300 NE 2nd Ave, Miami, FL (demo address)",
    dressCode: "Casual, paint-friendly",
    hostId: "priya",
    priceUsd: 52,
    basePriceUsd: 50,
    spots: 18,
    men: 3,
    women: 4,
    waitlist: 0,
    vibes: ["Artsy", "Live music", "Chill"],
    week: 6,
  },
  {
    id: "neon-disco",
    venue: "Rooftop",
    photo: photo("1714381633320-e5c3fd0f14db"),
    title: "Neon Disco Rooftop",
    theme: "80s disco on a Brickell rooftop: neon, glitter and a dance floor with a skyline",
    date: day(10, 21),
    neighborhood: "Brickell",
    address: "Rooftop · 1100 Brickell Bay Dr, Miami, FL (demo address)",
    dressCode: "Neon & glitter",
    hostId: "maya",
    priceUsd: 64,
    basePriceUsd: 55,
    spots: 24,
    men: 14,
    women: 8,
    waitlist: 0,
    vibes: ["Dancing", "Late night", "Dress-up"],
    week: 7,
  },
  {
    id: "lake-relay",
    venue: "Bay house",
    photo: photo("1613977257365-aaae5a9817ff"),
    title: "Biscayne Bay Day",
    theme: "Daytime at a house on the bay: paddle boards, BBQ and sunset on the dock",
    date: day(13, 15),
    neighborhood: "Key Biscayne",
    address: "Bay house · 77 Harbor Dr, Key Biscayne, FL (demo address)",
    dressCode: "Swimwear + layers",
    hostId: "priya",
    priceUsd: 58,
    basePriceUsd: 55,
    spots: 20,
    men: 2,
    women: 2,
    waitlist: 0,
    vibes: ["Outdoors", "Daytime", "Foodie"],
    week: 8,
  },
  {
    id: "garden-lights",
    venue: "Garden",
    photo: photo("1546373702-eb3e6f769df2"),
    title: "Backyard Under the Lights",
    theme: "String lights, a fire pit and long conversations in a big Coconut Grove garden",
    date: day(17, 20),
    neighborhood: "Coconut Grove",
    address: "Garden house · 3410 Main Hwy, Miami, FL (demo address)",
    dressCode: "Casual, bring a jacket",
    hostId: "derek",
    priceUsd: 45,
    basePriceUsd: 45,
    spots: 18,
    men: 3,
    women: 2,
    waitlist: 0,
    vibes: ["Chill", "Outdoors", "Small group"],
    week: 8,
  },
  {
    id: "glass-house",
    venue: "Glass house",
    photo: photo("1505843513577-22bb7d21e455"),
    title: "Glass House Listening Party",
    theme: "Modern glass house, vinyl only, cocktails made to order",
    date: day(20, 20),
    neighborhood: "Miami Beach",
    address: "Glass house · 4400 N Bay Rd, Miami Beach, FL (demo address)",
    dressCode: "All black",
    hostId: "maya",
    priceUsd: 60,
    basePriceUsd: 55,
    spots: 20,
    men: 12,
    women: 8,
    waitlist: 4,
    vibes: ["Dress-up", "Live music", "Late night"],
    week: 9,
  },
  {
    id: "villa-sunset",
    venue: "Villa",
    photo: photo("1613977257363-707ba9348227"),
    title: "Villa Sunset Dinner",
    theme: "White villa with a terrace: sunset dinner cooked by the host, then the pool",
    date: day(24, 18),
    neighborhood: "Pinecrest",
    address: "Villa · 9150 SW 62nd Ct, Pinecrest, FL (demo address)",
    dressCode: "Linen and light colours",
    hostId: "priya",
    priceUsd: 62,
    basePriceUsd: 55,
    spots: 22,
    men: 6,
    women: 7,
    waitlist: 0,
    vibes: ["Foodie", "Pool", "Daytime"],
    week: 9,
  },
];

// Season members — they vote on new applications and fill the demo party.
export const MEMBERS: Member[] = [
  { id: "m1", name: "Sarah K.", age: 32, gender: "woman", job: "UX designer", bio: "Moved from Chicago last year, runs on coffee and salsa classes.", personality: "warm but protective of the group vibe; dislikes arrogance", into: "Music", badges: ["Verified", "8 parties"], rating: 4.9 },
  { id: "m2", name: "Jessica L.", age: 35, gender: "woman", job: "Nurse practitioner", bio: "Night shifts, weekend hikes, competitive about trivia.", personality: "practical; wants people who will actually show up and be kind", into: "Games", badges: ["Verified", "6 parties"], rating: 4.8 },
  { id: "m3", name: "Ana R.", age: 30, gender: "woman", job: "Marketing manager", bio: "Bakes sourdough, paints badly, laughs loudly.", personality: "fun-first; says yes to playful, creative people", into: "Art", badges: ["Verified", "4 parties"], rating: 4.7 },
  { id: "m4", name: "Rachel T.", age: 38, gender: "woman", job: "Attorney", bio: "Two dogs, a new job, and finally has Friday nights free.", personality: "skeptical; red flags are an instant no", into: "Games", badges: ["Verified", "9 parties"], rating: 5.0 },
  { id: "m5", name: "Emily W.", age: 33, gender: "woman", job: "Teacher", bio: "History nerd, karaoke regular.", personality: "values curiosity and good manners", into: "Games", badges: ["Verified", "5 parties"], rating: 4.9 },
  { id: "m6", name: "Jake M.", age: 33, gender: "man", job: "Software engineer", bio: "New in Miami, learning to cook a proper Cuban sandwich.", personality: "easygoing; likes people who bring energy", into: "Food", badges: ["Verified", "3 parties"], rating: 4.6 },
  { id: "m7", name: "Marcus D.", age: 36, gender: "man", job: "Firefighter", bio: "Swims every morning, terrible dancer, great teammate.", personality: "looks for respect and team spirit", into: "Outdoors", badges: ["Verified", "7 parties"], rating: 4.9 },
  { id: "m8", name: "Daniel P.", age: 31, gender: "man", job: "Product manager", bio: "Board-game collector, escape-room record holder.", personality: "analytical; wants thoughtful answers, not one-liners", into: "Games", badges: ["Verified", "5 parties"], rating: 4.7 },
  { id: "m9", name: "Chris B.", age: 39, gender: "man", job: "Architect", bio: "Sketches everything, cooks Italian on Sundays.", personality: "relaxed but protective of the women in the group", into: "Art", badges: ["Verified", "8 parties"], rating: 4.8 },
  { id: "m10", name: "Tyler G.", age: 34, gender: "man", job: "Sales lead", bio: "Salsa champion of his office.", personality: "social; likes confident, friendly people", into: "Music", badges: ["Verified", "4 parties"], rating: 4.6 },
];


export function getParty(id: string) {
  return PARTIES.find((p) => p.id === id);
}
export function getHost(id: string) {
  return HOSTS.find((h) => h.id === id);
}
export function taken(p: Party) {
  return p.men + p.women;
}
export function spotsLeft(p: Party) {
  return Math.max(0, p.spots - taken(p));
}
// Dynamic pricing: the fewer spots left, the higher the price.
export function dynamicPrice(p: Party) {
  const fill = taken(p) / p.spots;
  return Math.round(p.basePriceUsd * (1 + Math.max(0, fill - 0.5) * 0.7));
}
