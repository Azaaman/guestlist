// Shared by the host application form, its API and the moderator desk.

export const HOST_THEMES: { theme: string; icon: string; titles: string[] }[] = [
  { theme: "Pool party", icon: "🏊", titles: ["Poolside Sundown", "Pool House Night", "Splash & Spritz"] },
  {
    theme: "Dinner party",
    icon: "🍽️",
    titles: ["Long Table Supper", "Sunday Supper Club", "Taco Table Night"],
  },
  { theme: "Rooftop night", icon: "🌆", titles: ["Rooftop Social", "Skyline Sessions", "Neon Rooftop"] },
  { theme: "Art night", icon: "🎨", titles: ["Paint & Pour", "Studio Night", "Canvas Club"] },
  {
    theme: "Garden evening",
    icon: "🌿",
    titles: ["Backyard Under the Lights", "Fire Pit Stories", "Garden Social"],
  },
  {
    theme: "Listening party",
    icon: "🎧",
    titles: ["Vinyl Night", "Records & Rosé", "Late Listening Session"],
  },
  { theme: "Game night", icon: "🎲", titles: ["Board Game Social", "Card Table Club", "Game Night Live"] },
  { theme: "Day party", icon: "☀️", titles: ["Bay Day", "Sunday Day Party", "Brunch Until Sunset"] },
];

export const NEIGHBORHOODS = [
  "Brickell",
  "Coconut Grove",
  "Coral Gables",
  "Downtown",
  "Key Biscayne",
  "Little Haiti",
  "Miami Beach",
  "Pinecrest",
  "Wynwood",
  "Other",
];

export const HOST_LIMITS = { minPhotos: 3, maxPhotos: 6, maxFileMB: 1.5, maxTotalMB: 4 };

export interface HostForm {
  name: string;
  email: string;
  phone: string;
  neighborhood: string;
  address: string;
  capacity: number;
  occupancy: "owner" | "renter";
  theme: string;
  title: string;
  about: string;
  profileId?: string;
}

export interface HostFiles {
  id: string[];
  ownership: string[];
  photos: string[];
}
