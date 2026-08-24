 /** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // This enables dark mode with class strategy
  theme: {
    extend: {
      colors: {
        black: '#0A0A0A',
        dark: '#1A1A1A',
        dark2: '#2A2A2A',
        light: '#F5F5F5',
        white: '#FFFFFF',
        muted: '#888888',
        'muted-light': '#E8E8E8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}