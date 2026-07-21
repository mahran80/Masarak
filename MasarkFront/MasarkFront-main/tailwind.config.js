/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ["class", "[data-theme='dark']"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
        },
        secondary: "var(--secondary)",
        accent: {
          DEFAULT: "var(--accent)",
          purple: "var(--accent-purple)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          border: "var(--surface-border)",
        },
        "on-primary": "#ffffff",
        "primary-container": "#1a365d",
        "on-primary-container": "#86a0cd",
        "primary-fixed": "#d6e3ff",
        "primary-fixed-dim": "#adc7f7",
        "secondary-container": "#d6e0f6",
        "on-surface-variant": "#43474e",
        "outline-variant": "#c4c6cf",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
      },
      spacing: {
        "container-max": "1440px",
      },
      fontFamily: {
        sans: ["Inter", "Tajawal", "sans-serif"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "600" }],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-up': 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};