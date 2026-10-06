import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'power-blue': '#00d4ff',
        'power-dark': '#010519',
      },
      fontFamily: {
        digital: ['"digital-clock-font"', 'monospace'],
        impact: ['Impact', 'Haettenschweiler', 'Arial Narrow Bold', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
      },
      keyframes: {
        neonChange: {
          '0%': { color: '#00ff00' },
          '25%': { color: '#00ffff' },
          '50%': { color: '#ff0000' },
          '75%': { color: '#0000ff' },
          '100%': { color: '#a6ff00' },
        },
        marquee: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(-700%)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        slideText: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'neon': 'neonChange 8s infinite linear',
        'marquee-chat': 'marquee 25s linear infinite',
        'spin-slow': 'spinSlow 5s linear infinite',
        'slide-text': 'slideText 15s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;