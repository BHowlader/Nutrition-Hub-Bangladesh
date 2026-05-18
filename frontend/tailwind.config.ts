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
        ink: "#080E1C",
        forest: "#0C1529",
        moss: "#1A3158",
        gold: "#60A5FA",
        champagne: "#93C5FD",
        mint: "#38BDF8",
        cream: "#F0F4FF",
        paper: "#F5F7FC",
        muted: "#94A3B8"
      },
      boxShadow: {
        premium: "0 26px 70px rgba(8,14,28,0.22)"
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
