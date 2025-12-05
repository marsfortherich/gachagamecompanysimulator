/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Game theme colors
        'gacha-gold': '#FFD700',
        'gacha-purple': '#8B5CF6',
        'gacha-blue': '#3B82F6',
        'gacha-green': '#10B981',
        'gacha-red': '#EF4444',
        // Rarity colors
        'rarity-common': '#9CA3AF',
        'rarity-uncommon': '#22C55E',
        'rarity-rare': '#3B82F6',
        'rarity-epic': '#A855F7',
        'rarity-legendary': '#F59E0B',
        'rarity-mythic': '#EC4899',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
