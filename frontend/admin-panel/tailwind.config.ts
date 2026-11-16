import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: "#0066CC",
            light: "#3385D6",
            dark: "#004D99",
            50: "#EFF6FF",
            100: "#DBEAFE",
            500: "#0066CC",
            600: "#0052A3",
            700: "#003D7A",
          },
          green: {
            DEFAULT: "#00B074",
            light: "#33C090",
            dark: "#008C5D",
            50: "#ECFDF5",
            100: "#D1FAE5",
            500: "#00B074",
            600: "#059669",
            700: "#047857",
          },
          navy: {
            DEFAULT: "#0F172A",
            dark: "#0B132B",
            light: "#1E293B",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;

