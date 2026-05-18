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
    id: "creatine-tropical-tango",
    name: "Wellcore Creatine — Tropical Tango",
    category: "Vitamins and minerals",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Tropical Tango flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#F59E0B",
    image: "/images/products/creatine/tropical-tango.jpg"
  },
  {
    id: "creatine-fruit-fusion",
    name: "Wellcore Creatine — Fruit Fusion",
    category: "Vitamins and minerals",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Fruit Fusion flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#EC4899",
    image: "/images/products/creatine/fruit-fusion.jpg"
  },
  {
    id: "creatine-kiwi-kick",
    name: "Wellcore Creatine — Kiwi Kick",
    category: "Vitamins and minerals",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Kiwi Kick flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#84CC16",
    image: "/images/products/creatine/kiwi-kick.jpg"
  },
  {
    id: "creatine-watermelon-wave",
    name: "Wellcore Creatine — Watermelon Wave",
    category: "Vitamins and minerals",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Watermelon Wave flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#EF4444",
    image: "/images/products/creatine/watermelon-wave.jpg"
  },
  {
    id: "mb-omega3-standard",
    name: "MuscleBlaze Omega 3 Fish Oil",
    category: "Vitamins and minerals",
    price: 1800,
    stock: 0,
    badge: "Sold out",
    description: "MuscleBlaze Omega 3 Fish Oil (90 Capsules). High-quality source of EPA & DHA to support cardiovascular wellness, joint flexibility, and brain function.",
    detail: "90 Capsules",
    accent: "#818CF8",
    image: "/images/products/mb-omega3-standard.png"
  },
  {
    id: "mb-omega3-gold",
    name: "MuscleBlaze Omega 3 Fish Oil Gold",
    category: "Vitamins and minerals",
    price: 1900,
    stock: 60,
    badge: "Triple Strength",
    description: "MuscleBlaze Triple Strength Omega 3 Fish Oil Gold (60 Capsules). Ultra-pure, molecularly distilled high-potency fish oil for peak recovery and muscle wellness.",
    detail: "60 Capsules",
    accent: "#F59E0B",
    image: "/images/products/mb-omega3-gold.png"
  },
  {
    id: "mb-vite-multivitamin",
    name: "MuscleBlaze MB-Vite Daily Multivitamin",
    category: "Vitamins and minerals",
    price: 2300,
    stock: 60,
    badge: "25 Essentials",
    description: "MuscleBlaze MB-Vite Daily Multivitamin (60 Tablets) with complete blends of key vitamins, minerals, and supreme immunity boosters to power active energy.",
    detail: "60 Tablets",
    accent: "#A78BFA",
    image: "/images/products/mb-vite-multivitamin.png"
  },
  {
    id: "mb-liquid-carnitine",
    name: "MuscleBlaze Liquid L-Carnitine PRO",
    category: "Vitamins and minerals",
    price: 1950,
    stock: 0,
    badge: "Sold out",
    description: "MuscleBlaze Liquid L-Carnitine PRO (Tangy Orange, 450ml). Packed with 3300mg fast-acting liquid L-Carnitine per serving for rapid fat metabolism and endurance.",
    detail: "450ml · 3300mg",
    accent: "#EF4444",
    image: "/images/products/mb-liquid-carnitine.png"
  },
  {
    id: "pintola-protein-oats",
    name: "PINTOLA 26g High Protein Oats",
    category: "Breakfast Cereal and peanut butter",
    price: 2200,
    stock: 50,
    badge: "Dark Chocolate",
    description: "PINTOLA 26g High Protein Oats 1kg, Dark Chocolate. Loaded with clean rolled oats and fast-absorbing protein isolate to power your morning workouts.",
    detail: "1kg · Dark Chocolate",
    accent: "#93C5FD",
    image: "/images/products/pintola-oats.png"
  },
  {
    id: "pintola-peanut-butter",
    name: "PINTOLA High Protein Peanut Butter",
    category: "Breakfast Cereal and peanut butter",
    price: 1650,
    stock: 0,
    badge: "Sold out",
    description: "PINTOLA High Protein Peanut Butter Chocolate Flavour Crunchy 1kg. Clean, rich roasted peanuts with zero hydrogenated oils and high protein concentration.",
    detail: "1kg · Crunchy Chocolate",
    accent: "#F59E0B",
    image: "/images/products/pintola-peanut-butter.png"
  },
  {
    id: "kapiva-ashwagandha-gold",
    name: "Kapiva Ashwagandha Gold",
    category: "Herbal Supplements",
    price: 2100,
    stock: 60,
    badge: "24k Gold",
    description: "Kapiva Ashwagandha Gold 60 Caps. Fortified with 24k gold leaf and premium standard extracts to naturally improve sleep, reduce stress, and maximize strength.",
    detail: "60 Capsules",
    accent: "#F59E0B",
    image: "/images/products/kapiva-ashwagandha.png"
  },
  {
    id: "kapiva-shilajit-gold",
    name: "Kapiva Shilajit Gold Resin",
    category: "Herbal Supplements",
    price: 3100,
    stock: 40,
    badge: "100% Pure Resin",
    description: "Kapiva Shilajit/Shilajeet Gold Resin – 40g. Highly purified Himalayan shilajit resin enriched with 24k gold and silver for optimal physical stamina, energy, and muscle power.",
    detail: "40g Resin",
    accent: "#F59E0B",
    image: "/images/products/shilajit-gold.png"
  }
];

export function formatTaka(value: number) {
  return `Tk ${new Intl.NumberFormat("en-BD").format(value)}`;
}
