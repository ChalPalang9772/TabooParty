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
        // Neon esports palette
        neon: {
          cyan: "#00f0ff",
          pink: "#ff2d7c",
          purple: "#a855f7",
          green: "#39ff14",
          orange: "#ff6b2b",
          yellow: "#ffd600",
          red: "#ff3333",
        },
        surface: {
          900: "#0a0a12",
          800: "#12121f",
          700: "#1a1a2e",
          600: "#242442",
          500: "#2e2e52",
          400: "#3a3a6a",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          light: "rgba(255, 255, 255, 0.1)",
          medium: "rgba(255, 255, 255, 0.15)",
        },
      },
      fontFamily: {
        display: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "shake": "shake 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "card-flip": "cardFlip 0.6s ease-in-out",
        "score-pop": "scorePop 0.8s ease-out",
        "combo-pulse": "comboPulse 0.4s ease-out",
        "streak-fire": "streakFire 1s ease-out",
        "urgent-tick": "urgentTick 1s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px currentColor, 0 0 20px currentColor" },
          "100%": { boxShadow: "0 0 10px currentColor, 0 0 40px currentColor, 0 0 60px currentColor" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        cardFlip: {
          "0%": { transform: "rotateY(0deg)" },
          "50%": { transform: "rotateY(90deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        scorePop: {
          "0%": { transform: "scale(0.5) translateY(0)", opacity: "0" },
          "50%": { transform: "scale(1.3) translateY(-20px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(-40px)", opacity: "0" },
        },
        comboPulse: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        streakFire: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.5)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "0.8" },
        },
        urgentTick: {
          "0%, 100%": { transform: "scale(1)", color: "#ff3333" },
          "50%": { transform: "scale(1.1)", color: "#ff6b2b" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "neon-grid": "linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;
