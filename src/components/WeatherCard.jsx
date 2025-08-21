import React, { useState } from "react";

function WeatherCard({ weather, iconStr, id, city, countryCode, date }) {
  console.log("weathercard :", weather, iconStr, date);

  if (weather && weather.main) {
    return (
      <div id={id} className="bg-gray-300 rounded-2xl shadow-lg px-6 py-4 ">
        <div className="text-primarytwo text-left text-xs">
          <p className="text-xs">
            {city}, {countryCode} |{" "}
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            })}
          </p>
          <div className="text-s grid grid-cols-1 lg:grid-cols-2">
            <p>Min: {Math.round(weather.main.temp_min)}°C</p>
            <p>Max: {Math.round(weather.main.temp_max)}°C</p>
          </div>
          <div></div>
          <p className="text-accenttwo text-lg text-bold">
            {Math.round(weather.main.temp)}°C
            <img src={iconStr} alt="weather icon"></img>
          </p>

          <p>Feels like {Math.round(weather.main.feels_like)}°C</p>
          <p>
            {weather.weather[0].description.charAt(0).toUpperCase() +
              weather.weather[0].description.slice(1)}
          </p>
          <p className="">Humidity: {weather.main.humidity}%</p>
          <p className="">Wind: {weather.wind.speed}m/s</p>
        </div>
      </div>
    );
  } else <p>Enter a valid city.</p>;
}

export default WeatherCard;
