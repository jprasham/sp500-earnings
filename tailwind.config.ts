import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        display: ['"Outfit"', "system-ui", "sans-serif"],
      },
      colors: {
        beat: { DEFAULT: "#16a34a", light: "#dcfce7", bg: "#f0fdf4" },
        miss: { DEFAULT: "#dc2626", light: "#fee2e2", bg: "#fef2f2" },
        inline: { DEFAULT: "#ca8a04", light: "#fef9c3", bg: "#fefce8" },
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8fafc",
          tertiary: "#f1f5f9",
        },
        ink: {
          DEFAULT: "#0f172a",
          secondary: "#475569",
          muted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
