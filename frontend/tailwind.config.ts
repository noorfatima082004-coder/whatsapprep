import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#142D2B",
          green: "#25D366",
          secondary: "#128C5E",
          soft: "#EAF7EF",
          app: "#F5F8F6",
        },
        ink: {
          DEFAULT: "#263238",
          muted: "#718078",
        },
        line: "#E5EBE8",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 45, 43, 0.04), 0 4px 16px rgba(20, 45, 43, 0.05)",
        soft: "0 8px 24px rgba(20, 45, 43, 0.08)",
      },
      borderRadius: {
        card: "14px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
