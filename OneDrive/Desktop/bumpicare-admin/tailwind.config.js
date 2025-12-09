/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'gradient-x': 'gradient-x 3s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'slide-in': 'slide-in 1s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        },
        'slide-in': {
          from: { transform: 'translateX(20px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        primary: {
          DEFAULT: "#06A096",
          50: "#E6F7F5",
          100: "#CCEFEB",
          200: "#99DFD7",
          300: "#66CFC3",
          400: "#33BFAF",
          500: "#06A096",
          600: "#058078",
          700: "#04605A",
          800: "#02403C",
          900: "#01201E",
        },
        accent: {
          DEFAULT: "#F88E0F",
          50: "#FEF3E5",
          100: "#FDE7CC",
          200: "#FBCF99",
          300: "#F9B766",
          400: "#F79F33",
          500: "#F88E0F",
          600: "#C6710C",
          700: "#955509",
          800: "#633906",
          900: "#321C03",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}