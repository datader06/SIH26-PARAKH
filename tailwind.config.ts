import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FBF7F0",
        surface: {
          DEFAULT: "#FFFFFF",
          50: "#FFFDFA",
          100: "#FDFAF4",
          200: "#F6EFE3",
          300: "#EFE5D3",
        },
        ink: {
          DEFAULT: "#2B2420",
          soft: "#6B6054",
          faint: "#9A8F80",
        },
        border: "#E9DFCC",
        ring: "#C96F4A",
        clay: {
          50: "#FCF1EA",
          100: "#F8E2D3",
          200: "#F0C3A6",
          300: "#E6A179",
          400: "#DB8359",
          500: "#C96F4A",
          600: "#B2583A",
          700: "#8F452E",
          800: "#6E3524",
          900: "#4D241A",
        },
        sage: {
          50: "#F1F6EE",
          100: "#E1ECDB",
          200: "#C3D9B7",
          300: "#A3C492",
          400: "#89B075",
          500: "#719A5C",
          600: "#5A7D48",
        },
        sand: {
          50: "#FBF7F0",
          100: "#F6EFE3",
          200: "#EFE5D3",
          300: "#E5D7BE",
          400: "#D6C4A3",
        },
        amber: {
          50: "#FBF1DF",
          100: "#F6E2B8",
          500: "#C78C33",
          600: "#A6721F",
        },
        rose: {
          50: "#FBEAE6",
          100: "#F5D2CA",
          500: "#C25B47",
          600: "#A3442F",
        },
        dusk: {
          50: "#EBF0F2",
          100: "#D4E0E5",
          500: "#5B82A0",
          600: "#466A87",
        },
        risk: {
          low: "#719A5C",
          review: "#C78C33",
          high: "#C25B47",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "Consolas", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(43, 36, 32, 0.04), 0 2px 8px -2px rgba(43, 36, 32, 0.06)",
        card: "0 2px 6px 0 rgba(43, 36, 32, 0.04), 0 8px 24px -8px rgba(43, 36, 32, 0.08)",
        lift: "0 4px 10px 0 rgba(43, 36, 32, 0.06), 0 16px 32px -12px rgba(43, 36, 32, 0.14)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
