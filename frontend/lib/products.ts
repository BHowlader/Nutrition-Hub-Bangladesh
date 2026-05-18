export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  badge: string;
  description: string;
  detail: string;
  accent: string;
  image?: string;
};

export const products: Product[] = [
  {
    id: "iso-whey-performance",
    name: "Iso Whey Performance",
    category: "Protein",
    price: 7850,
    stock: 42,
    badge: "Best seller",
    description: "Premium whey isolate for lean muscle recovery, smooth mixing, and daily protein targets.",
    detail: "25g protein per serving",
    accent: "#60A5FA",
    image: "/images/products/iso-whey.png"
  },
  {
    id: "creatine-tropical-tango",
    name: "Wellcore Creatine — Tropical Tango",
    category: "Strength",
    price: 2450,
    stock: 77,
    badge: "Best seller",
    description: "Micronised creatine monohydrate with rapid absorption. 83 servings, 3g per scoop for muscle strength and ATP production.",
    detail: "83 servings · 307g",
    accent: "#F59E0B",
    image: "/images/products/creatine/tropical-tango.jpg"
  },
  {
    id: "creatine-kiwi-kick",
    name: "Wellcore Creatine — Kiwi Kick",
    category: "Strength",
    price: 2450,
    stock: 65,
    badge: "Lab tested",
    description: "Micronised creatine monohydrate with kiwi flavour. Third-party lab tested, HACCP certified, zero side effects.",
    detail: "83 servings · 307g",
    accent: "#84CC16",
    image: "/images/products/creatine/kiwi-kick.jpg"
  },
  {
    id: "creatine-fruit-fusion",
    name: "Wellcore Creatine — Fruit Fusion",
    category: "Strength",
    price: 2450,
    stock: 53,
    badge: "New flavour",
    description: "Micronised creatine monohydrate with fruit fusion taste. Boosts ATP production for enhanced muscle growth.",
    detail: "83 servings · 307g",
    accent: "#EC4899",
    image: "/images/products/creatine/fruit-fusion.jpg"
  },
  {
    id: "creatine-watermelon-wave",
    name: "Wellcore Creatine — Watermelon Wave",
    category: "Strength",
    price: 2450,
    stock: 41,
    badge: "Popular",
    description: "Micronised creatine monohydrate with watermelon flavour. Trustified certified with rapid absorption formula.",
    detail: "83 servings · 307g",
    accent: "#EF4444",
    image: "/images/products/creatine/watermelon-wave.jpg"
  },
  {
    id: "omega-3-ultra",
    name: "Omega-3 Ultra",
    category: "Wellness",
    price: 1950,
    stock: 64,
    badge: "Fresh stock",
    description: "High-strength omega softgels for everyday heart, brain, and joint wellness support.",
    detail: "Purified fish oil",
    accent: "#818CF8",
    image: "/images/products/omega3.png"
  },
  {
    id: "daily-multivitamin",
    name: "Daily Multivitamin",
    category: "Vitamins",
    price: 1650,
    stock: 89,
    badge: "Daily",
    description: "Complete daily vitamin and mineral formula for active students, professionals, and athletes.",
    detail: "30-day routine",
    accent: "#A78BFA",
    image: "/images/products/multivitamin.png"
  },
  {
    id: "pre-workout-charge",
    name: "Pre-Workout Charge",
    category: "Strength",
    price: 3200,
    stock: 28,
    badge: "New",
    description: "Workout energy and focus blend for heavy training days, evening sessions, and cardio.",
    detail: "Blue raspberry flavor",
    accent: "#67E8F9",
    image: "/images/products/pre-workout.png"
  },
  {
    id: "lean-mass-gainer",
    name: "Lean Mass Gainer",
    category: "Protein",
    price: 5950,
    stock: 31,
    badge: "Value",
    description: "Calorie-dense nutrition for hard gainers who need clean bulk support and recovery.",
    detail: "Protein + carbs blend",
    accent: "#93C5FD",
    image: "/images/products/mass-gainer.png"
  }
];

export function formatTaka(value: number) {
  return `Tk ${new Intl.NumberFormat("en-BD").format(value)}`;
}
