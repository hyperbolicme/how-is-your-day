import React, { useState, useEffect } from "react";

import CurrentWeatherSection from "./CurrentWeatherSection";
import ForecastWeatherSection from "./ForecastWeatherSection";

const WeatherSection = ({
  currentCity,
  setCurrentCity,
  setIsLoading,
  setCountry,
}) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);

  async function getWeather(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const query = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : WeatherAPI. ");

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("Weather API failed.");
      const data = await res.json();
      console.log("weather data: ", data);

      setWeather(data);
      setCountry(data.sys.country);
    } catch (error) {
      console.error("Error fetching weather:", error);
      setWeather(null);
      setCurrentCity(DEFAULT_CITY);
      setCountry(DEFAULT_COUNTRY);
    }
  }

  async function getForecast(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const query = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : ForecastAPI. ");

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("Forecast API failed.");
      const data = await res.json();
      console.log("forecast data: ", data);

      setForecast(data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      setForecast(null);
    }
  }

  useEffect(() => {
    setIsLoading(true);

    console.log("currentCity changed to :", currentCity);
    getWeather(currentCity);
    getForecast(currentCity);
    setIsLoading(false);
  }, [currentCity]);

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Current Weather */}
      <CurrentWeatherSection currentCity={currentCity} weather={weather} />

      {/* 5-Day Forecast */}
      <ForecastWeatherSection currentCity={currentCity} forecast={forecast} />
    </div>
  );
};

export default WeatherSection;
