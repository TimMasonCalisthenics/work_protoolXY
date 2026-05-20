/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors mapped to CSS variables
        page: 'rgb(var(--bg-page) / <alpha-value>)',
        card: 'rgb(var(--bg-card) / <alpha-value>)',
        'card-hover': 'rgb(var(--bg-card-hover) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--text-secondary) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--text-accent) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
