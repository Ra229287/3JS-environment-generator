/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0e1016',
          secondary: '#151820',
          tertiary: '#1c202a',
        },
        surface: {
          DEFAULT: '#151820',
          border: '#2a3042',
        },
        accent: {
          primary: '#00C49A',
          secondary: '#9D8CFF',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
