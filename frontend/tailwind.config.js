/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taktis: {
          primary: '#00bcd4',    // Cyan
          dark: '#0f0f0f',       // Dark Base
          accent1: '#8c52ff',    // Purple
          accent2: '#ff4c4c',    // Red
          neutral: '#d1d5db',    // Gray
        }
      }
    },
  },
  plugins: [],
}
