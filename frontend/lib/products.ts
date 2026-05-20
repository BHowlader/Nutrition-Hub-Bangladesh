export type Product = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  stock: number;
  badge: string;
  description: string;
  detail: string;
  accent: string;
  image?: string;
};

export const products: Product[] = [
  // ── Gym Supplements › Creatine ──
  {
    id: "creatine-tropical-tango",
    name: "Wellcore Creatine — Tropical Tango",
    category: "Gym Supplements",
    subcategory: "Creatine",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Tropical Tango flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#F59E0B",
    image: "/images/products/creatine/tropical-tango.png"
  },
  {
    id: "creatine-fruit-fusion",
    name: "Wellcore Creatine — Fruit Fusion",
    category: "Gym Supplements",
    subcategory: "Creatine",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Fruit Fusion flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#EC4899",
    image: "/images/products/creatine/fruit-fusion.png"
  },
  {
    id: "creatine-kiwi-kick",
    name: "Wellcore Creatine — Kiwi Kick",
    category: "Gym Supplements",
    subcategory: "Creatine",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Kiwi Kick flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#84CC16",
    image: "/images/products/creatine/kiwi-kick.png"
  },
  {
    id: "creatine-watermelon-wave",
    name: "Wellcore Creatine — Watermelon Wave",
    category: "Gym Supplements",
    subcategory: "Creatine",
    price: 2500,
    stock: 83,
    badge: "83 Servings",
    description: "Wellcore Micronised Creatine Monohydrate in Watermelon Wave flavor. Rapid absorption formula for explosive power, muscle growth, and ATP production.",
    detail: "83 servings · 307g",
    accent: "#EF4444",
    image: "/images/products/creatine/watermelon-wave.jpg"
  },

  // ── Gym Supplements › Amino Acid ──
  {
    id: "mb-liquid-carnitine",
    name: "MuscleBlaze Liquid L-Carnitine PRO",
    category: "Gym Supplements",
    subcategory: "Amino Acid",
    price: 2100,
    stock: 45,
    badge: "1100mg L-Carnitine",
    description: "MuscleBlaze Liquid L-Carnitine PRO (Tangy Orange, 450ml). Packed with 1100mg fast-acting liquid L-Carnitine per serving for rapid fat metabolism and endurance.",
    detail: "450ml · Tangy Orange",
    accent: "#EF4444",
    image: "/images/products/mb-liquid-carnitine.png"
  },

  // ── Vitamins & Supplements › Fish Oil & Omega 3 ──
  {
    id: "mb-omega3-standard",
    name: "MuscleBlaze Omega 3 Fish Oil",
    category: "Vitamins & Supplements",
    subcategory: "Fish Oil & Omega 3",
    price: 1900,
    stock: 90,
    badge: "90 Capsules",
    description: "MuscleBlaze Omega 3 Fish Oil (90 Capsules). High-quality source of EPA & DHA to support cardiovascular wellness, joint flexibility, and brain function.",
    detail: "90 Capsules",
    accent: "#818CF8",
    image: "/images/products/mb-omega3-standard.png"
  },
  {
    id: "mb-omega3-gold",
    name: "MuscleBlaze Omega 3 Fish Oil Gold",
    category: "Vitamins & Supplements",
    subcategory: "Fish Oil & Omega 3",
    price: 1900,
    stock: 60,
    badge: "Triple Strength",
    description: "MuscleBlaze Triple Strength Omega 3 Fish Oil Gold (60 Capsules). Ultra-pure, molecularly distilled high-potency fish oil for peak recovery and muscle wellness.",
    detail: "60 Capsules",
    accent: "#F59E0B",
    image: "/images/products/mb-omega3-gold.png"
  },

  // ── Vitamins & Supplements › Multivitamin ──
  {
    id: "mb-vite-multivitamin",
    name: "MuscleBlaze MB-Vite Daily Multivitamin",
    category: "Vitamins & Supplements",
    subcategory: "Multivitamin",
    price: 2200,
    stock: 60,
    badge: "25 Essentials",
    description: "MuscleBlaze MB-Vite Daily Multivitamin (60 Tablets) with complete blends of key vitamins, minerals, and supreme immunity boosters to power active energy.",
    detail: "60 Tablets",
    accent: "#A78BFA",
    image: "/images/products/mb-vite-multivitamin.png"
  },
  {
    id: "on-multivitamin-men",
    name: "Optimum Nutrition Multivitamin for MEN",
    category: "Vitamins & Supplements",
    subcategory: "Multivitamin",
    price: 2800,
    stock: 60,
    badge: "For Men",
    description: "Optimum Nutrition (ON) Multivitamin for MEN – 60 Tablets. Comprehensive daily formula tailored for active men with essential vitamins and minerals.",
    detail: "60 Tablets",
    accent: "#10B981",
    image: "/images/products/on-multivitamin-men.png"
  },

  // ── Vitamins & Supplements › Herbal Supplements ──
  {
    id: "kapiva-ashwagandha-gold",
    name: "Kapiva Ashwagandha Gold",
    category: "Vitamins & Supplements",
    subcategory: "Herbal Supplements",
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
    category: "Vitamins & Supplements",
    subcategory: "Herbal Supplements",
    price: 3100,
    stock: 40,
    badge: "100% Pure Resin",
    description: "Kapiva Shilajit/Shilajeet Gold Resin – 40g. Highly purified Himalayan shilajit resin enriched with 24k gold and silver for optimal physical stamina, energy, and muscle power.",
    detail: "40g Resin",
    accent: "#F59E0B",
    image: "/images/products/shilajit-gold.png"
  },

  // ── Protein Oats ──
  {
    id: "pintola-protein-oats",
    name: "PINTOLA 26g High Protein Oats",
    category: "Protein Oats",
    price: 2200,
    stock: 50,
    badge: "Dark Chocolate",
    description: "PINTOLA 26g High Protein Oats 1kg, Dark Chocolate. Loaded with clean rolled oats and fast-absorbing protein isolate to power your morning workouts.",
    detail: "1kg · Dark Chocolate",
    accent: "#93C5FD",
    image: "/images/products/pintola-oats.png"
  },
  {
    id: "pintola-masala-oats",
    name: "PINTOLA 26g High Protein Masala Oats",
    category: "Protein Oats",
    price: 2200,
    stock: 50,
    badge: "Spiced Masala",
    description: "PINTOLA 26g High Protein Masala Oats 1kg. Spiced masala oats with high protein content for a savory, nutritious breakfast option.",
    detail: "1kg · Spiced Masala",
    accent: "#F97316",
    image: "/images/products/pintola-masala-oats.png"
  },
  {
    id: "pintola-muesli",
    name: "Pintola High Protein Muesli Dark Chocolate & Cranberry",
    category: "Protein Oats",
    price: 2200,
    stock: 50,
    badge: "Dark Chocolate & Cranberry",
    description: "Pintola High Protein Muesli Dark Chocolate & Cranberry 1kg. A crunchy blend of oats, nuts, and cranberries with dark chocolate and high protein content.",
    detail: "1kg · Dark Chocolate & Cranberry",
    accent: "#E11D48",
    image: "/images/products/pintola-muesli.png"
  },

  // ── Peanut Butter ──
  {
    id: "pintola-peanut-butter-crunchy",
    name: "PINTOLA High Protein Peanut Butter Crunchy",
    category: "Peanut Butter",
    price: 1700,
    stock: 50,
    badge: "Chocolate Crunchy",
    description: "PINTOLA High Protein Peanut Butter Chocolate Flavour Crunchy 1kg. Clean, rich roasted peanuts with zero hydrogenated oils and high protein concentration.",
    detail: "1kg · Chocolate Crunchy",
    accent: "#F59E0B",
    image: "/images/products/pintola-peanut-butter.png"
  },
  {
    id: "pintola-peanut-butter-creamy",
    name: "PINTOLA High Protein Peanut Butter Creamy",
    category: "Peanut Butter",
    price: 1700,
    stock: 50,
    badge: "Chocolate Creamy",
    description: "PINTOLA High Protein Peanut Butter Chocolate Flavour Creamy 1kg. Smooth and rich peanut butter with high protein and zero hydrogenated oils.",
    detail: "1kg · Chocolate Creamy",
    accent: "#D97706",
    image: "/images/products/pintola-pb-creamy.png"
  },
  {
    id: "pintola-peanut-butter-crispy",
    name: "Pintola High Protein Dark Chocolate Peanut Butter Crispy",
    category: "Peanut Butter",
    price: 1700,
    stock: 50,
    badge: "Dark Chocolate Crispy",
    description: "Pintola High Protein Dark Chocolate Peanut Butter Crispy 1kg. Premium dark chocolate crispy peanut butter with high protein for a rich, crunchy experience.",
    detail: "1kg · Dark Chocolate Crispy",
    accent: "#78350F",
    image: "/images/products/pintola-pb-crispy.png"
  }
];

export function formatTaka(value: number) {
  return `Tk ${new Intl.NumberFormat("en-BD").format(value)}`;
}
