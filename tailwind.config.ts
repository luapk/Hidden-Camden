import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#161210',
        paper: '#F0E6D2',
        camden: '#D8432F',
        'camden-red': '#D8432F',
        brass: '#C9933C',
        cream: '#EFE7D6',
        smoke: '#8A8077',
      },
      fontFamily: {
        display: ['var(--font-anton)', 'Anton', 'sans-serif'],
        mono: ['var(--font-courier)', 'Courier Prime', 'Courier New', 'monospace'],
        ticket: ['var(--font-courier)', 'Courier Prime', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
