import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Nutrition Hub Bangladesh | Premium Supplements",
  description:
    "CMS-ready premium e-commerce platform for authentic supplements and sports nutrition in Bangladesh.",
  metadataBase: new URL("https://nutritionhubbangladesh.com"),
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><AuthProvider><CartProvider>{children}</CartProvider></AuthProvider></body>
    </html>
  );
}
