/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Default theme (Midnight)
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#818cf8',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        // Dark theme colors
        bg: {
          primary: '#0f0f1a',
          secondary: '#1a1a2e',
          tertiary: '#252542',
        },
        border: '#2d2d4a',
        text: {
          primary: '#ffffff',
          secondary: '#a0a0b8',
          muted: '#6b6b80',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
