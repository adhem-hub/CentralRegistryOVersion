/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],

  plugins: [],
  corePlugins: {
    preflight: true,
  },
  // Add base styles
  theme: {
    extend: {
      screens: {
        'tablet': '740px', 
       // 'sm': '640px',
        // 'md': '768px',
        // 'lg': '1024px',
        // 'xl': '1280px',
        // '2xl': '1536px',
      },
      // You can also add custom letter-spacing values here if needed
      letterSpacing: {
        'custom': '1px',
      }
    },
  },
  // Use the addBase function via plugin
  plugins: [
    function({ addBase }) {
      addBase({
        '*': {
          'letter-spacing': '1px',
        },
      })
    }
  ],
}