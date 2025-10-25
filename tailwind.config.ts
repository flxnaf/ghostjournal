import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          white: '#ffffff',
          glow: '#f0f0f0',
          blue: '#4488ff',     // Emotion: sadness
          purple: '#bf00ff',
          pink: '#ff00bf',
        },
        dark: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#16161e',
          border: '#1f1f2e',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { 
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.3), 0 0 10px rgba(255, 255, 255, 0.1)',
          },
          '100%': { 
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },
  },
  plugins: [],
}
export default config

