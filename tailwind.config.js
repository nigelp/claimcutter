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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc6fb',
          400: '#36aaf5',
          500: '#0c8ee6',
          600: '#0070c9',
          700: '#0159a6',
          800: '#084b88',
          900: '#0d4071',
          950: '#082749',
        },
        secondary: {
          50: '#f4f9f4',
          100: '#e6f2e6',
          200: '#cce5cd',
          300: '#99cb9b',
          400: '#66b069',
          500: '#3d9641',
          600: '#2c7830',
          700: '#255f28',
          800: '#214c23',
          900: '#1c3f1e',
          950: '#0e2210',
        },
        accent: {
          50: '#fef7f0',
          100: '#fdedd9',
          200: '#f9d9b0',
          300: '#f5be7e',
          400: '#f09a47',
          500: '#ec7f21',
          600: '#de6316',
          700: '#b84b14',
          800: '#933d17',
          900: '#773416',
          950: '#421908',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}