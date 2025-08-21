import { React, useState } from "react";
import WeatherCard from "./WeatherCard";
import ForecastSection from "./ForecastSection";

function WeatherSection({ setCountry, setUserInput }) {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [iconStr, setIconStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log("setCountry :", setCountry);
  async function getWeather(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const query = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : ", query);

    try {
      setLoading(true);
      const res = await fetch(query);
      if (!res.ok) throw new Error("Weather API failed.");
      const data = await res.json();
      console.log("weather data: ", data);

      setWeather(data);
      setCountry(data.sys.country);
      setIconStr(
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
      );
    } catch (error) {
      console.error("Error fetching weather:", error);
      // show error to user #bugfix
    } finally {
      setLoading(false);
    }
  }

  async function getForecast(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    const query = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : ", query);

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("Weather API failed.");
      const data = await res.json();
      console.log("forecast data: ", data);

      setForecast(data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      // show error to user #bugfix
    }
  }

  const handleGetDay = async () => {
    if (!city.trim()) {
      setError("Please enter city");
      console.error("No city entered by user.");
      // show error to user #bugfix
      return;
    }
    
    setError(null);
    try {
      await Promise.all([getWeather(city), getForecast(city)]);
      // Only trigger News fetch after weather.
      setUserInput(true);
      // Reset timer for userinput flag
      setTimeout(() => setUserInput(false), 100);
    } catch (error) {
      setError("Failed to fetch weather data. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();

  return (
    <section className="min-h-screen flex items-start justify-start bg-secondarytwo text-primarytwo">
      <div className="px-40 py-10 gap-16">
        <div className="text-left py-10">
          <h1 className="py-3 float-animate text-accenttwo font-poiret font-bold text-3xl lg:text-5xl">
            Weather
          </h1>
          {/* <form onSubmit={handleGetWeather}> */}
          <input
            className="px-1 py-0 bg-transparent text-primarytwo border-0 border-b-2 border-primarytwo focus:border-primarytwo focus:outline-none transition-colors"
            type="text"
            placeholder="Enter city... eg. Kochi"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleGetDay()}
          />
          <div className="px-0 py-3 ">
            <button
              onClick={handleGetDay}
              className=" bg-primarytwo text-textlight px-4 py-2 rounded-lg hover:bg-accenttwo"
              disable={ loading || !city.trim()}
            >
              {loading ? "Loading..." : "How is your day?"}              
            </button>
          </div>
          {error && (
            <div className="text-red-500 py-2 text-sm"> 
              {error}
            </div>
          )}
          
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5">
          <WeatherCard
            weather={weather}
            iconStr={iconStr}
            id={0}
            city={weather && weather.name}
            countryCode={weather && weather.sys.country}
            date={today.toDateString()}
          ></WeatherCard>
        </div>
        <div>
          <ForecastSection forecast={forecast} />
        </div>
      </div>
    </section>
  );
}

export default WeatherSection;
