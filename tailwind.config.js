/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#1E3A5F',
        'emerald': '#10B981',
        'amber': '#F59E0B',
      },
    },
  },
  plugins: [],
}