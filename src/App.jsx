import React from 'react';

import WeatherSection from './components/WeatherSection';
import NewsSection from './components/NewsSection';
import HeroSection from './components/HeroSection';

function App() {
 

  return (
    <div className='font-mont'>
      <HeroSection />
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen font-mont">
        <WeatherSection />
        <NewsSection />
      </div>
    </div>
  );
}

export default App;
