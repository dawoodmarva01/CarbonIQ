/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#FAFAF8",
        panel: "#FFFFFF",
        panel2: "#F3F5F1",
        lime: "#1D9E75",
        coral: "#E0563F",
        sage: "#5C6B62",
        cream: "#10221A",
        line: "#E4E7E2",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 0.85, transform: "scale(1)" },
          "50%": { opacity: 1, transform: "scale(1.03)" },
        },
        countUp: {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 3.5s ease-in-out infinite",
        countUp: "countUp 0.4s ease-out",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,34,26,0.04), 0 8px 24px rgba(16,34,26,0.06)",
      },
    },
  },
  plugins: [],
};
