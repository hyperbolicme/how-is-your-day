/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"],
  
  theme: {
    extend: {
      colors: {
        // Teal/Green Theme - Enhanced for better contrast
        primaryone: '#2D5F5A',      // Darker for better text contrast (was #86BBB5)
        primaryonelight: '#86BBB5', // Keep original as light variant
        secondaryone: '#A7CDC9',    // Keep as background
        accentone: '#1A4D47',       // Much darker for links/headings (was #65A9A1)
        accentonelight: '#65A9A1',  // Keep original as light accent

        // Blue Theme - Enhanced for better contrast  
        primarytwo: '#2D4A5F',      // Darker for better text contrast (was #86A6BB)
        primarytwolight: '#86A6BB', // Keep original as light variant
        secondarytwo: '#A7BECD',    // Keep as background
        accenttwo: '#1A3A52',       // Much darker for headings (was #49799C)
        accenttwolight: '#49799C',  // Keep original as light accent

        // Hero Section Colors
        primaryhero: '#868CBB',
        secondaryhero:'#A7ABCD',

        // Additional contrast colors
        textdark: '#1F2937',        // Very dark gray for primary text
        textlight: '#F9FAFB',       // Off-white for text on dark backgrounds
        border: '#E5E7EB',          // Light gray for borders
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