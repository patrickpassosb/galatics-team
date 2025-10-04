/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-dark': '#0a0e1a',
        'space-medium': '#1a1f35',
        'space-light': '#2a3150',
      },
    },
  },
  plugins: [],
}

