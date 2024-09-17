const svgToDataUri = require("mini-svg-data-uri");

const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        "ramillas-light": ['"TT Ramillas Light"', "sans-serif"],
        "ramillas-stroke": ['"TT Ramillas Stroke"', "sans-serif"],
        gt: ['"GT Regular"', "sans-serif"],
        "gt-bold": ['"GT Bold"', "sans-serif"],
      },
      fontSize: {
        xxs: "0.7rem",
        xs: "0.85rem",
        sm: "1rem",
        md: "1.175rem",
        base: "1.3rem",
        lg: "1.5rem",
        xl: "1.75rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        "4xl": "2.7rem",
        "5xl": "3rem",
      },
      colors: {
        bg: {
          DEFAULT: "var(--color-bg)",
          contrast: "var(--color-bg-contrast)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          10: "var(--color-accent-10)",
          20: "var(--color-accent-20)",
          30: "var(--color-accent-30)",
          40: "var(--color-accent-40)",
        },
        text: {
          contrast: "var(--color-text-contrast)",
          DEFAULT: "var(--color-text)",
          10: "var(--color-text-10)",
          20: "var(--color-text-20)",
          30: "var(--color-text-30)",
          40: "var(--color-text-40)",
          base: "var(--color-base)",
          "base-contrast": "var(--color-base-contrast)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          contrast: "var(--color-primary-contrast)",
          20: "var(--color-primary-20)",
        },
        pink: {
          DEFAULT: "var(--color-pink)",
          contrast: "var(--color-pink-contrast)",
        },
        green: {
          DEFAULT: "var(--color-green)",
        },
        root: "var(--color-root)",
        "root-contrast": "var(--color-root-contrast)",
      },
    },
  },
  plugins: [
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "bg-grid": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-grid-small": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-dot": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme("backgroundColor")), type: "color" }
      );
    },
  ],
};
