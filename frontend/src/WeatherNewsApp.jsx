import React, { useEffect, useState } from "react";

import HeroSection from "./components/HeroSection.jsx";
import SearchBar from "./components/SearchBar.jsx";
import LoadingAnimation from "./components/LoadingAnimation.jsx";
import WeatherSection from "./components/WeatherSection.jsx";
import TopNewsSection from "./components/TopNewsSection.jsx";

const DEFAULT_CITY = "Kochi";
const DEFAULT_COUNTRY = "IN";

const WeatherNewsApp = () => {
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  // const [news, setNews] = useState(null);
  const [error, setError] = useState(null);

  return (
    <div
      className="min-h-screen font-mont"
      style={{
        background:
          "linear-gradient(135deg, #1A4D47 0%, #2D5F5A 35%, #1A3A52 70%, #2D4A5F 100%)",
      }}
    >
      {/* Animated background elements */}
      {/* <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{backgroundColor: '#86BBB5'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 opacity-15 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" style={{backgroundColor: '#86A6BB'}}></div>
      </div> */}

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <HeroSection />

        {/* Search Bar */}
        <SearchBar
          setCurrentCity={setCurrentCity}
          setIsLoading={setIsLoading}
        />

        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Weather Section */}
            <WeatherSection
              currentCity={currentCity}
              setCurrentCity={setCurrentCity}
              setIsLoading={setIsLoading}
              setCountry={setCountry}
            />
            {/* News Section */}
            <TopNewsSection country={country} setIsLoading={setIsLoading} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherNewsApp;
