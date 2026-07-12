/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#002045",
        "on-primary": "#ffffff",
        "primary-container": "#1a365d",
        "on-primary-container": "#86a0cd",
        "primary-fixed": "#d6e3ff",
        "primary-fixed-dim": "#adc7f7",
        "secondary-container": "#d6e0f6",
        "on-surface-variant": "#43474e",
        "outline-variant": "#c4c6cf",
        surface: "#f7f9fb",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
      },
      spacing: {
        "container-max": "1440px",
      },
      fontFamily: {
        sans: ["Cairo", "sans-serif"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};