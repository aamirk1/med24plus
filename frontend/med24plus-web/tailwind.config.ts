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
            DEFAULT: "#0D9488",
            light: "#2DD4BF",
            dark: "#0F766E",
            50: "#F0FDFA",
            100: "#CCFBF1",
            500: "#14B8A6",
            600: "#0D9488",
            700: "#0F766E",
          },
          navy: {
            DEFAULT: "#0F172A",
            dark: "#0B132B",
            light: "#1E293B",
          },
          primary: {
            DEFAULT: "#0D9488",
            dark: "#0F766E",
            light: "#F0FDFA",
            50: "#F0FDFA",
            100: "#CCFBF1",
            200: "#99F6E4",
            500: "#14B8A6",
            600: "#0D9488",
            700: "#0F766E",
            800: "#115E59",
          },
          secondary: {
            DEFAULT: "#2563EB",
            dark: "#1D4ED8",
            light: "#DBEAFE",
            50: "#EFF6FF",
            100: "#DBEAFE",
            500: "#2563EB",
            600: "#2563EB",
            700: "#1D4ED8",
          },
          surface: "#FFFFFF",
          maintext: "#132A27",
          sectext: "#64748B",
          borderline: "#E2E8F0",
          appsuccess: "#16A34A",
          appwarning: "#D97706",
          appdanger: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
      },
    },
},
  plugins: [],
};

export default config;
