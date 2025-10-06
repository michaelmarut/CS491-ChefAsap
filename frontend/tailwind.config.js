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
          'olive-500': '#3f3f1f',   // earthy dark olive

          'base-100': '#fefce8',    // soft cream 
          'base-200': '#6b7280',    // neutral slate
          'base-300': '#2c3e50',    // fallback background color

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

