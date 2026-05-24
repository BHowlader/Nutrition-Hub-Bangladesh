import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        forest: "rgb(var(--color-forest) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        champagne: "rgb(var(--color-champagne) / <alpha-value>)",
        mint: "rgb(var(--color-mint) / <alpha-value>)",
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)"
      },
      boxShadow: {
        premium: "var(--shadow-premium)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Montserrat", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
