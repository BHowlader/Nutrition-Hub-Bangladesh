import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products | Nutrition Hub Bangladesh",
  description:
    "Browse 100% authentic supplements, protein oats, peanut butter, vitamins and more. Delivered nationwide via Pathao Courier with cash on delivery.",
  openGraph: {
    title: "All Products | Nutrition Hub Bangladesh",
    description:
      "Browse 100% authentic supplements, protein oats, peanut butter, vitamins and more. Delivered nationwide via Pathao Courier.",
    type: "website",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
