/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF9F5',
        ink: '#1F1E1C',
        clay: {
          50: '#FBF9F4', 100: '#F3EEE3', 200: '#E8DFCC', 300: '#D9CBA8',
          400: '#C9AB7D', 500: '#BD7A45', 600: '#A85E2E', 700: '#8A4A24'
        },
        sage: { 50: '#F2F6F1', 100: '#E1EBDD', 500: '#5B8A5A', 600: '#456B44' },
        slate: { 650: '#3E3D3A' }
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      borderRadius: { xl2: '1.1rem' }
    }
  },
  plugins: []
};
