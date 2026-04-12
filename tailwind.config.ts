import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          900: "#0a0e1a",
          800: "#101627",
          700: "#18203a",
          600: "#1f2a47",
        },
        accent: {
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
          blue: "#3b82f6",
          indigo: "#6366f1",
          cyan: "#06b6d4",
        },
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(99,102,241,0.35)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
