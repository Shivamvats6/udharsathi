/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0F2942", light: "#173A5E", dark: "#0A1D30" },
        brand: { DEFAULT: "#1665D8", light: "#4C8DF0", dark: "#0F4CA6" },
        teal: { DEFAULT: "#0EA5A0", light: "#5FD1CC" },
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#E11D48",
        surface: "#F4F7FB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 41, 66, 0.08), 0 1px 2px rgba(15, 41, 66, 0.06)",
        popover: "0 10px 30px rgba(15, 41, 66, 0.15)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
