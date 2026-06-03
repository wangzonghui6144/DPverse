/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8eccff',
          400: '#59b0ff',
          500: '#2e8eff',
          600: '#1a6ef7',
          700: '#1358e3',
          800: '#1648b8',
          900: '#183f91',
          950: '#142858',
        },
        medical: {
          50: '#f0fdf6',
          100: '#dbfdec',
          200: '#b9f8d9',
          300: '#82f0bb',
          400: '#45df97',
          500: '#1cc578',
          600: '#10a361',
          700: '#11804f',
          800: '#136541',
          900: '#115337',
          950: '#032e1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(46, 142, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(46, 142, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
