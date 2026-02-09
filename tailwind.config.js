/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          750: '#27272a',
          850: '#1f1f22',
          950: '#0c0c0e',
        }
      }
    },
  },
  plugins: [],
}
