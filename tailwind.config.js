/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"],
  
  theme: {
    extend: {
      colors: {
        primaryone: '#4A4729',
        secondaryone : '#D6C9AC',
        primarytwo: '#6293B6',
        secondarytwo: '#A7BECD',
        thirdtwo: '#49799C',
      },
      fontFamily: {
        merri: ['Merriweather', 'serif'],
        mont: ['Montserrat', 'sans-serif'],
        poiret: ['Poiret One', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

