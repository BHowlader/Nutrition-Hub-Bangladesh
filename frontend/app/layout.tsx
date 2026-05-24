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
