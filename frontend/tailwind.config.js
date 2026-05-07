/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        sans: ["'Outfit'", "sans-serif"],
      },
      colors: {
        bg: "#0D0B08",
        surface: "#161410",
        surface2: "#1E1B16",
        surface3: "#272320",
        gold: "#D4A84B",
        gold2: "#E8C97A",
        gold3: "#F5E4B5",
        text1: "#F0EBE1",
        text2: "#A89880",
        text3: "#6B5E4E",
        border: "rgba(212,168,75,0.15)",
        border2: "rgba(212,168,75,0.3)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-up": "fadeUp 0.6s ease forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(24px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
