import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse 100% authentic gym supplements, creatine, protein oats, peanut butter, vitamins, and herbal supplements in Bangladesh. Pathao delivery with cash on delivery.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "All Products | Nutrition Hub Bangladesh",
    description:
      "Browse 100% authentic supplements, protein oats, peanut butter, vitamins and more. Delivered nationwide via Pathao Courier.",
    type: "website",
    images: [{ url: "/images/og-cover.png", width: 1200, height: 630, alt: "Nutrition Hub Bangladesh Products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Products | Nutrition Hub Bangladesh",
    description: "Browse 100% authentic supplements delivered across Bangladesh.",
    images: ["/images/og-cover.png"],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
