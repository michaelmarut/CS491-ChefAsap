/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'olive-100': '#d9f99d',   // light olive
        'olive-200': '#bef264',   // olive accent
        'olive-300': '#65a30d',   // olive green
        'olive-400': '#4d7c0f',   // rich olive
        'olive-500': '#36401F',   // earthy dark olive

        'primary-100': '#d9f99d',   // light olive
        'primary-200': '#bef264',   // olive accent
        'primary-300': '#65a30d',   // olive green
        'primary-400': '#4d7c0f',   // rich olive
        'primary-500': '#36401F',   // earthy dark olive

        'dark-500': '#d9f99d',   // light olive
        'dark-400': '#bef264',   // olive accent
        'dark-300': '#65a30d',   // olive green
        'dark-200': '#4d7c0f',   // rich olive
        'dark-100': '#36401F',   // earthy dark olive

        'base-100': '#fefce8',    // soft cream 
        'base-200': '#6b7280',    // neutral slate
        'base-300': '#2c3e50',    // fallback background color

        'base-dark-300': '#fefce8',    // soft cream 
        'base-dark-200': '#6b7280',    // neutral slate
        'base-dark-100': '#2c3e50',    // fallback background color

        'warm-gray': '#78716c',   // warm gray
      },
      fontFamily: {
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.title-shadow-sm': {
          textShadowColor: 'rgba(255, 255, 255, 1)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        },
        '.title-shadow-md': {
          textShadowColor: 'rgba(255, 255, 255, 1)',
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 4,
        },
      });
    },
  ],
}

