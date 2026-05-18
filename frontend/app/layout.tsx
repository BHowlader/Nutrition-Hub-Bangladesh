import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Nutrition Hub Bangladesh | Premium Supplements",
  description:
    "CMS-ready premium e-commerce platform for authentic supplements and sports nutrition in Bangladesh.",
  metadataBase: new URL("https://nutritionhubbangladesh.com")
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
