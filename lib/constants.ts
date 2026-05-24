import {
  Briefcase, HeartHandshake, HeartPulse, Landmark, Scale, Wallet,
  type LucideIcon,
} from "lucide-react";

export type CategorySlug =
  | "marriage" | "health" | "wealth" | "legal" | "finance" | "career";

export const CATEGORIES: { slug: CategorySlug; label: string; icon: LucideIcon }[] = [
  { slug: "marriage", label: "Marriage", icon: HeartHandshake },
  { slug: "health",   label: "Health",   icon: HeartPulse },
  { slug: "wealth",   label: "Wealth",   icon: Wallet },
  { slug: "legal",    label: "Legal",    icon: Scale },
  { slug: "finance",  label: "Finance",  icon: Landmark },
  { slug: "career",   label: "Career",   icon: Briefcase },
];

export type FilterMode = "all" | "celebrity" | "new";

export const FILTER_MODES: { slug: FilterMode; label: string }[] = [
  { slug: "all",       label: "All" },
  { slug: "celebrity", label: "Celebrity" },
  { slug: "new",       label: "NEW!" },
];

export type SeedCounsellor = {
  slug: string; name: string; portrait: string;
  specialties: string[]; languages: string[]; experienceYears: number;
  rating: number; ordersCount: number; pricePerMin: number;
  originalPricePerMin: number; waitMinutes: number;
  isCelebrity: boolean; isNew: boolean; categories: CategorySlug[];
};

// Price scales with rating: pricePerMin = round((rating - 3) * 5 + 5), originalPricePerMin ≈ 2.5x.
export const SEED_COUNSELLORS: SeedCounsellor[] = [
  { slug: "pratyuksha", name: "Pratyuksha", portrait: "/portraits/pratyuksha.png", specialties: ["Vedic","Tarot","Face Reading"], languages: ["English","Hindi"], experienceYears: 13, rating: 5.0, ordersCount: 10000, pricePerMin: 15, originalPricePerMin: 38, waitMinutes: 4, isCelebrity: true, isNew: false, categories: ["marriage","career"] },
  { slug: "devrajit",   name: "Devrajit",   portrait: "/portraits/devrajit.png",   specialties: ["Vedic","Numerology","Vastu"],   languages: ["English","Hindi"], experienceYears: 16, rating: 4.9, ordersCount: 10000, pricePerMin: 15, originalPricePerMin: 38, waitMinutes: 0, isCelebrity: true, isNew: false, categories: ["wealth","finance"] },
  { slug: "prarthna",   name: "Prarthna",   portrait: "/portraits/prarthna.png",   specialties: ["Numerology","Tarot","Vedic"],   languages: ["English","Hindi"], experienceYears: 12, rating: 4.8, ordersCount: 8000,  pricePerMin: 14, originalPricePerMin: 35, waitMinutes: 0, isCelebrity: true, isNew: false, categories: ["wealth","marriage"] },
  { slug: "lishvika",   name: "Lishvika",   portrait: "/portraits/lishvika.png",   specialties: ["Tarot","Life Coach"],            languages: ["English","Hindi"], experienceYears: 10, rating: 4.6, ordersCount: 5000,  pricePerMin: 13, originalPricePerMin: 33, waitMinutes: 0, isCelebrity: false, isNew: false, categories: ["legal","career"] },
  { slug: "parasharya", name: "Parasharya", portrait: "/portraits/parasharya.png", specialties: ["Vedic","Palmistry"],            languages: ["English","Hindi"], experienceYears: 8,  rating: 4.4, ordersCount: 10000, pricePerMin: 12, originalPricePerMin: 30, waitMinutes: 16, isCelebrity: false, isNew: false, categories: ["marriage","career","wealth"] },
  { slug: "jeeshan",    name: "Jeeshan",    portrait: "/portraits/jeeshan.png",    specialties: ["Vedic","Face Reading","Life Coach"], languages: ["English","Hindi"], experienceYears: 7, rating: 4.2, ordersCount: 10000, pricePerMin: 11, originalPricePerMin: 28, waitMinutes: 0, isCelebrity: false, isNew: false, categories: ["health","career"] },
  { slug: "rohan",      name: "Rohan",      portrait: "/portraits/rohan.png",      specialties: ["Vedic","Vastu"],                languages: ["English","Hindi"], experienceYears: 9,  rating: 4.0, ordersCount: 6000,  pricePerMin: 10, originalPricePerMin: 25, waitMinutes: 0, isCelebrity: false, isNew: false, categories: ["legal","finance"] },
  { slug: "deepanshi",  name: "Deepanshi",  portrait: "/portraits/deepanshi.png",  specialties: ["Tarot","Numerology"],            languages: ["English","Hindi"], experienceYears: 5,  rating: 3.8, ordersCount: 10000, pricePerMin: 9,  originalPricePerMin: 23, waitMinutes: 0, isCelebrity: false, isNew: false, categories: ["marriage","career"] },
  { slug: "gracy",      name: "Gracy",      portrait: "/portraits/gracy.png",      specialties: ["Tarot","Psychic"],              languages: ["English","Hindi"], experienceYears: 7,  rating: 3.6, ordersCount: 1000,  pricePerMin: 8,  originalPricePerMin: 20, waitMinutes: 6, isCelebrity: false, isNew: false, categories: ["marriage","legal"] },
  { slug: "siya",       name: "Siya",       portrait: "/portraits/siya.png",       specialties: ["Tarot","Psychic","Vastu"],      languages: ["Hindi"],           experienceYears: 4,  rating: 3.4, ordersCount: 500,   pricePerMin: 7,  originalPricePerMin: 18, waitMinutes: 0, isCelebrity: false, isNew: true,  categories: ["health"] },
  { slug: "bhavyanshi", name: "Bhavyanshi", portrait: "/portraits/bhavyanshi.png", specialties: ["Vedic","Life Coach"],            languages: ["Hindi","English"], experienceYears: 3,  rating: 3.2, ordersCount: 10000, pricePerMin: 6,  originalPricePerMin: 15, waitMinutes: 0, isCelebrity: false, isNew: true,  categories: ["marriage","health"] },
  { slug: "amit",       name: "Amit",       portrait: "/portraits/amit.png",       specialties: ["Vedic"],                        languages: ["Hindi"],           experienceYears: 5,  rating: 3.0, ordersCount: 2000,  pricePerMin: 5,  originalPricePerMin: 13, waitMinutes: 0, isCelebrity: false, isNew: false, categories: ["finance","wealth"] },
];
