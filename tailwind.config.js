/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Using Hex codes to ensure opacity modifiers work correctly in v3
        primary: {
          DEFAULT: '#8b5cf6', // Violet 500
          glow: 'rgba(139, 92, 246, 0.4)',
        },
        secondary: '#06b6d4', // Cyan 500
        glass: 'rgba(255, 255, 255, 0.1)',
        surface: '#1e293b', // Slate 800
        muted: '#94a3b8', // Slate 400
        dark: '#0f172a', // Slate 900
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
