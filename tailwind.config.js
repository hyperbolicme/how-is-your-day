/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"],
  
  theme: {
    extend: {
      colors: {
        primaryone: '#86BBB5',
        secondaryone : '#A7CDC9',
        accentone: '#65A9A1',

        primarytwo: '#86A6BB',
        secondarytwo: '#A7BECD',
        accenttwo: '#49799C',

        primaryhero: '#868CBB',
        secondaryhero:'#A7ABCD',
      },
      fontFamily: {
        merri: ['Merriweather', 'sans-serif'],
        mont: ['Montserrat', 'sans-serif'],
        poiret: ['Poiret One', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

