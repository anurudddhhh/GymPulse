/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Classy Charcoal + Champagne Palette
        'bg-base': '#0F0F10',
        'bg-surface': '#171718',
        'bg-elevated': '#1F1F21',
        'bg-subtle': '#2A2A2C',

        // Borders
        'border-subtle': '#2A2A2C',
        'border-focus': '#C4A574',

        // Warm Typography
        'text-main': '#F2F0ED',
        'text-muted': '#9C9A96',
        'text-dim': '#6B6B69',

        // Accents — Champagne Gold instead of blue
        'brand': '#C4A574',
        'brand-hover': '#B8956A',
        'accent-emerald': '#7D9B8A',
        'accent-amber': '#C4A574',
        'accent-rose': '#C4787A',
      },
    },
  },
  plugins: [],
}