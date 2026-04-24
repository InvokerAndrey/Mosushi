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
        "on-primary-fixed-variant": "#920212",
        "on-tertiary-fixed-variant": "#454841",
        "on-secondary-container": "#167249",
        "on-secondary": "#ffffff",
        "surface-bright": "#f9f9ff",
        "surface": "#f9f9ff",
        "on-error": "#ffffff",
        "background": "#f9f9ff",
        "on-surface-variant": "#5a403e",
        "on-tertiary-fixed": "#191d17",
        "surface-container": "#e8eeff",
        "secondary-fixed-dim": "#83d8a6",
        "surface-container-highest": "#dde2f3",
        "secondary": "#0a6c44",
        "primary-fixed-dim": "#ffb3ad",
        "on-error-container": "#93000a",
        "on-tertiary-container": "#e8ebe1",
        "surface-tint": "#b52426",
        "on-primary-container": "#ffe4e1",
        "on-secondary-fixed": "#002111",
        "primary-fixed": "#ffdad6",
        "surface-container-low": "#f1f3ff",
        "primary-container": "#c53030",
        "secondary-fixed": "#9ff5c1",
        "outline-variant": "#e2bebb",
        "on-surface": "#161c27",
        "inverse-on-surface": "#ecf0ff",
        "tertiary-fixed": "#e1e3da",
        "on-secondary-fixed-variant": "#005231",
        "outline": "#8e706d",
        "surface-variant": "#dde2f3",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e3e8f9",
        "on-tertiary": "#ffffff",
        "primary": "#a2141b",
        "tertiary": "#4f524b",
        "error-container": "#ffdad6",
        "secondary-container": "#9ff5c1",
        "on-primary-fixed": "#410003",
        "tertiary-fixed-dim": "#c5c7be",
        "error": "#ba1a1a",
        "inverse-surface": "#2a303d",
        "on-primary": "#ffffff",
        "surface-dim": "#d4daea",
        "inverse-primary": "#ffb3ad"
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
        "ingredient-list": ["Epilogue"],
        "heading-xl": ["Epilogue"],
        "product-name": ["Epilogue"],
        "price": ["Epilogue"],
        "heading-lg": ["Epilogue"],
        "body-regular": ["Epilogue"],
        "label-caps": ["Epilogue"],
        "epilogue": ["Epilogue"]
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