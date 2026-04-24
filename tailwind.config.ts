import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "tertiary-container": "#676a62",
        "on-background": "#161c27",
        "primary-container": "#c53030",
        "primary": "#a2141b",
        "tertiary": "#4f524b",
        "on-surface": "#161c27",
        "red-500": "#ef4444",
        "green-500": "#22c55e",
        "green-600": "#16a34a",
        "green-700": "#047857",
        "zinc-950": "#09090b",
        "zinc-100": "#f4f4f5",
        "zinc-900": "#18181b",
        "zinc-400": "#a1a1aa",
        "zinc-500": "#71717a",
        "zinc-600": "#52525b",
        "zinc-300": "#d4d4d8",
        "white": "#ffffff",
        "transparent": "transparent",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "sm": "16px",
        "unit": "4px",
        "margin": "32px",
        "xl": "80px",
        "xs": "8px",
        "lg": "48px",
        "gutter": "24px",
        "md": "24px"
      },
      fontFamily: {
        "ingredient-list": ["Satoshi"],
        "heading-xl": ["Satoshi"],
        "product-name": ["Satoshi"],
        "price": ["Satoshi"],
        "heading-lg": ["Satoshi"],
        "body-regular": ["Satoshi"],
        "label-caps": ["Satoshi"],
        "satoshi": ["Satoshi"]
      },
      fontSize: {
        "ingredient-list": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "heading-xl": ["48px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "600" }],
        "product-name": ["20px", { "lineHeight": "1.4", "fontWeight": "500" }],
        "price": ["18px", { "lineHeight": "1.4", "fontWeight": "600" }],
        "heading-lg": ["32px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "body-regular": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "label-caps": ["12px", { "lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "600" }]
      }
    }
  },
  plugins: [],
};

export default config;