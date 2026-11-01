/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Existing primary tokens (keep)
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

        // Semantic aliases mapped to current palette (no visual change)
        brand: { DEFAULT: "#2563eb", light: "#dbeafe", dark: "#1d4ed8" }, // blue-600/100/700
        success: { DEFAULT: "#059669", light: "#d1fae5" },               // emerald-600/100
        warning: { DEFAULT: "#b45309", light: "#fef3c7" },               // amber-700/100 (contrast AA compliant)
        danger: { DEFAULT: "#dc2626", light: "#fee2e2" },                // red-600/100
        "surface-semantic": {
          DEFAULT: "#f8fafc",
          alt: "#f1f5f9",
          inverse: "#1e293b",
        }, // slate-50/100/800
        "border-semantic": { DEFAULT: "#e2e8f0", strong: "#cbd5e1" },    // slate-200/300
      },
      spacing: {
        "container-max": "1440px",
        "touch-target": "2.75rem", // 44px — WCAG minimum
      },
      borderRadius: {
        card: "1rem",
        input: "0.75rem",
        button: "0.75rem",
        badge: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
      },
      fontFamily: {
        sans: ["Tajawal", "Inter", "sans-serif"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
    },
  },
};