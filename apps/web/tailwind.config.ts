import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          25: "#fcfcfd",
        },
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#5570f1",
          600: "#465fff",
          700: "#3147d0",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 24px rgba(16, 24, 40, 0.03)",
      },
      fontFamily: {
        sans: ["\"Plus Jakarta Sans\"", "Inter", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        "panel-grid":
          "radial-gradient(circle at 1px 1px, rgba(70, 95, 255, 0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
