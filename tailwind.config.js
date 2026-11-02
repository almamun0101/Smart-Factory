
// Design system: industrial control-room aesthetic.
// Palette named after factory-floor materials/instruments, not generic "primary/secondary".
const config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        steel: {
          50: "#F5F6F7",
          100: "#E7E9EC",
          200: "#CBD0D6",
          300: "#A3AAB4",
          400: "#767F8C",
          500: "#565F6C",
          600: "#3E4652",
          700: "#2B323D",
          800: "#1B2129",
          900: "#12161C",
          950: "#0B0E12",
        },
        // Signal amber — the gauge-needle accent
        gauge: {
          50: "#FFF8EB",
          100: "#FEECC7",
          200: "#FDD98A",
          300: "#FBC04D",
          400: "#F5A623",
          500: "#E08A00",
          600: "#B86B00",
          700: "#8F5100",
          800: "#663900",
          900: "#3D2200",
        },
        // Deep instrument blue — secondary accent
        instrument: {
          400: "#3E6FA8",
          500: "#2A5486",
          600: "#1E3A5F",
          700: "#152944",
        },
        ok: "#4C9A6A",
        warn: "#E08A00",
        danger: "#C24444",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(11,14,18,0.06), 0 8px 24px -8px rgba(11,14,18,0.10)",
        "panel-dark": "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        panel: "14px",
      },
      keyframes: {
        "needle-sweep": {
          "0%": { transform: "rotate(-8deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "needle-sweep": "needle-sweep 0.6s cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};
export default config;
