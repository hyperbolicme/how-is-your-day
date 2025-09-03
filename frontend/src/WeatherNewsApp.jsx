import React, { useState } from "react";

import HeroSection from "./components/HeroSection.jsx";
import SearchBar from "./components/SearchBar.jsx";
import LoadingAnimation from "./components/LoadingAnimation.jsx";
import WeatherSection from "./components/WeatherSection.jsx";
import TopNewsSection from "./components/TopNewsSection.jsx";
import ReportSection from "./components/ReportSection.jsx";

const DEFAULT_CITY = "Kochi";
const DEFAULT_COUNTRY = "IN";

const WeatherNewsApp = () => {
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [error, setError] = useState(null);

  return (
    <div
      className="min-h-screen font-mont"
      style={{
        background:
          "linear-gradient(135deg, #1A4D47 0%, #2D5F5A 35%, #1A3A52 70%, #2D4A5F 100%)",
      }}
    >
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <HeroSection />

        {/* Search Bar */}
        <SearchBar
          setCurrentCity={setCurrentCity}
          setIsLoading={setIsLoading}
        />

        {/* Generate Report Section */}
        <ReportSection 
          isLoading={isLoading} 
          currentCity={currentCity} 
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
