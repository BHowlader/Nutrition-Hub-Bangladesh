import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "@/lib/theme";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Nutrition Hub Bangladesh | Premium Supplements & Sports Nutrition",
    template: "%s | Nutrition Hub Bangladesh",
  },
  description:
    "Shop 100% authentic gym supplements, creatine, protein oats, vitamins, and peanut butter in Bangladesh. Verified products, Pathao delivery, and cash on delivery.",
  metadataBase: new URL("https://nutritionhubbd.com"),
  alternates: { canonical: "/" },
  keywords: [
    "supplements Bangladesh",
    "gym supplements BD",
    "creatine Bangladesh",
    "protein oats",
    "Wellcore creatine",
    "MuscleBlaze Bangladesh",
    "PINTOLA peanut butter",
    "authentic supplements",
    "Nutrition Hub Bangladesh",
    "sports nutrition Dhaka",
  ],
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "Nutrition Hub Bangladesh",
    title: "Nutrition Hub Bangladesh | Premium Supplements & Sports Nutrition",
    description:
      "Shop 100% authentic gym supplements, creatine, protein oats, vitamins, and peanut butter in Bangladesh. Verified products with Pathao delivery.",
    images: [{ url: "/images/og-cover.png", width: 1080, height: 1080, alt: "Nutrition Hub Bangladesh" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nutrition Hub Bangladesh | Premium Supplements",
    description:
      "100% authentic gym supplements, creatine, protein, and vitamins delivered across Bangladesh.",
    images: ["/images/og-cover.png"],
  },
  verification: {
    google: "O_AcCeKmO5QmxrRlXJzuvdaGHrfEnmSWWhvAY1P0jr4",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

const themeScript = `(function(){var t=localStorage.getItem("nhb-theme");if(!t)t="light";document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <WhatsAppButton />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
