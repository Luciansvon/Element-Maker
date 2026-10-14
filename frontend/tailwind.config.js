/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#0b0f17',
          900: '#111827',
          850: '#162032',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
        }
      },
      backgroundImage: {
        'checkerboard': "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%)",
        'checkerboard-light': "repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%)",
      },
      backgroundSize: {
        'checker': '20px 20px',
      }
    },
  },
  plugins: [],
}
