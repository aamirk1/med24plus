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
            DEFAULT: "#0052CC",
            light: "#0066EE",
            dark: "#0B3A70",
            50: "#EFF6FF",
            100: "#DBEAFE",
            500: "#0052CC",
            600: "#0043A8",
            700: "#0B3A70",
            900: "#07192F",
          },
          green: {
            DEFAULT: "#00A86B",
            light: "#10B981",
            dark: "#00875A",
            50: "#ECFDF5",
            100: "#D1FAE5",
            500: "#00A86B",
            600: "#00875A",
            700: "#065F46",
          },
          navy: {
            DEFAULT: "#07192F",
            dark: "#040D1A",
            light: "#0E2849",
          },
          primary: {
            DEFAULT: "#0052CC",
            dark: "#0043A8",
            light: "#EFF6FF",
            50: "#EFF6FF",
            100: "#DBEAFE",
            200: "#BFDBFE",
            500: "#0052CC",
            600: "#0043A8",
            700: "#0B3A70",
            800: "#07192F",
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
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
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
