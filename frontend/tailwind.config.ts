import type { Config } from "tailwindcss";

// RAKSHA AI design tokens — a command-centre dark UI (justified: this is
// literally police/command-centre software, not a marketing site).
// Accent split: amber = alert/threat, blue = calm/verified, so colour
// itself carries meaning across every module.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0E14",        // near-black command-centre background
        panel: "#12161F",       // card/panel background
        line: "#1F2530",        // hairline borders
        ink: "#E7EAF0",         // primary text
        muted: "#8891A5",       // secondary text
        alert: "#F5A623",       // amber — threat/warning
        danger: "#EF4444",      // red — high risk / counterfeit
        safe: "#3DDC97",        // green — authentic / low risk
        accent: "#4C7CF3",      // blue — informational / links
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
