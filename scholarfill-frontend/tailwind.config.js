/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          0:   "#ffffff",
          50:  "#f8f9fb",
          100: "#f1f2f6",
          200: "#e4e6ef",
          300: "#d1d5e0",
        },
        ink: {
          DEFAULT: "#0f1117",
          muted:   "#6b7280",
          subtle:  "#9ca3af",
        }
      },
      fontFamily: {
        display: ["'DM Sans'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        pop:  "0 8px 32px rgba(99,102,241,0.16)",
        input:"0 0 0 3px rgba(99,102,241,0.15)",
      }
    },
  },
  plugins: [],
}
