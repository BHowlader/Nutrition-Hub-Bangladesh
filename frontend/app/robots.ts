import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api", "/cart", "/login", "/signup"],
      },
    ],
    sitemap: "https://nutritionhubbd.com/sitemap.xml",
  };
}
