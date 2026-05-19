/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TÜBİTAK projenin profesyonel görünmesi için gerekli neon renk paleti
        'neon-purple': {
          DEFAULT: '#a855f7',
          light: '#c084fc',
        },
        'neon-green': {
          DEFAULT: '#22c55e',
          light: '#4ade80',
        },
        'space': {
          950: '#02040a',
          900: '#030712',
          800: '#0f172a',
          700: '#1e293b',
          300: '#94a3b8',
          400: '#64748b',
        },
        'glass': {
          bg: 'rgba(15, 23, 42, 0.6)',
          border: 'rgba(148, 163, 184, 0.1)',
          hover: 'rgba(148, 163, 184, 0.2)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
