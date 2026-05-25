import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nutrition Hub Bangladesh",
    short_name: "NutritionHub",
    description: "Premium authentic supplements and sports nutrition in Bangladesh",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCF8",
    theme_color: "#B45309",
    icons: [
      { src: "/images/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/images/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
