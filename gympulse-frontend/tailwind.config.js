/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#121212',
        card: '#1E1E1E',
        primary: '#3B82F6', // Blue accent
        accent: '#10B981', // Green for achievements/streaks
      }
    },
  },
  plugins: [],
}