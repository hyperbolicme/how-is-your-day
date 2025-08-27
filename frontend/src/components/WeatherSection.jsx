import React, { useState, useEffect } from "react";
import CurrentWeatherSection from "./CurrentWeatherSection";
import ForecastWeatherSection from "./ForecastWeatherSection";
import ApiService from "../services/api";

const WeatherSection = ({
  currentCity,
  setCurrentCity,
  setIsLoading,
  setCountry,
}) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);

  const DEFAULT_CITY = "Kochi";
  const DEFAULT_COUNTRY = "IN";

  async function getWeather(city) {
    try {
      console.log("Fetching weather for:", city);
      const response = await ApiService.getWeather(city);
      
      if (response.success) {
        // Transform backend response to match frontend expectations
        const transformedData = {
          name: response.data.city,
          sys: {
            country: response.data.country,
            sunrise: response.data.sunrise,
            sunset: response.data.sunset,
          },
          main: {
            temp: response.data.temperature,
            feels_like: response.data.feelsLike,
            humidity: response.data.humidity,
          },
          wind: {
            speed: response.data.windSpeed,
          },
          weather: [{
            description: response.data.description,
            icon: response.data.icon,
          }],
          coord: response.data.coords,
        };

        setWeather(transformedData);
        setCountry(response.data.country);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      setError(error.message);
      setWeather(null);
      setCurrentCity(DEFAULT_CITY);
      setCountry(DEFAULT_COUNTRY);
    }
  }

  async function getForecast(city) {
    try {
      console.log("Fetching forecast for:", city);
      const response = await ApiService.getForecast(city);
      
      if (response.success) {
        // Transform backend response to match frontend expectations
        const transformedData = {
          city: {
            name: response.data.city,
            country: response.data.country,
          },
          list: response.data.forecasts.map(forecast => ({
            dt_txt: forecast.date,
            main: {
              temp: forecast.temperature,
              humidity: forecast.humidity,
            },
            wind: {
              speed: forecast.windSpeed,
            },
            weather: [{
              description: forecast.description,
              icon: forecast.icon,
            }],
          })),
        };

        setForecast(transformedData);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      setError(error.message);
      setForecast(null);
    }
  }

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      console.log("currentCity changed to:", currentCity);
      
      try {
        await Promise.all([
          getWeather(currentCity),
          getForecast(currentCity)
        ]);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [currentCity]);

  // Show error state if needed
  if (error) {
    return (
      <div className="lg:col-span-2 space-y-6">
        <div className="backdrop-blur-lg border rounded-3xl p-8" 
             style={{
               backgroundColor: "rgba(167, 205, 201, 0.1)",
               borderColor: "rgba(167, 205, 201, 0.2)",
             }}>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4" style={{ color: "#F9FAFB" }}>
              Weather Service Unavailable
            </h3>
            <p style={{ color: "rgba(167, 205, 201, 0.8)" }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg"
              style={{
                backgroundColor: "rgba(167, 205, 201, 0.2)",
                color: "#F9FAFB"
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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