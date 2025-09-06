import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

import { getDayOfWeek } from "../hooks/Utilities";

const ForecastWeatherSection = ({ currentCity, forecast }) => {
  const [forecastList, setForecastList] = useState(null);

  function getForecastWeathers() {
    if (!forecastList) return;
    let forecastWeathers = [];

    forecastList?.map((dayweather) => {
      let w = {};
      w.day = getDayOfWeek(dayweather.dt_txt);
      w.iconsrc = `https://openweathermap.org/img/wn/${dayweather?.weather[0]?.icon}@2x.png`;
      w.temp = Math.round(dayweather?.main?.temp);
      w.humidity = dayweather?.main?.humidity;
      w.windspeed = dayweather?.wind?.speed;
      forecastWeathers.push(w);
    });

    return forecastWeathers;
  }

  useEffect(() => {
    if (!forecast) return;
    setForecastList(
      forecast.list.filter((item) => item.dt_txt.includes("12:00:00"))
    );
  }, [forecast]);

  return (
    <div
      className="backdrop-blur-lg border rounded-3xl p-8"
      style={{
        backgroundColor: "rgba(167, 205, 201, 0.1)",
        borderColor: "rgba(167, 205, 201, 0.2)",
      }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="w-6 h-6" style={{ color: "#A7CDC9" }} />
        <h3 className="text-xl font-semibold" style={{ color: "#F9FAFB" }}>
          5-Day Forecast
        </h3>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {getForecastWeathers()?.map((dayweather, index) => (
          <div
            key={index}
            className="text-center rounded-xl p-4 hover:bg-opacity-20 transition-colors"
            style={{ backgroundColor: "rgba(167, 205, 201, 0.05)" }}
          >
            <div
              className="text-sm font-medium mb-3"
              style={{ color: "#A7CDC9" }}
            >
              {dayweather.day}
            </div>
            <div className="flex justify-center mb-3">
              {dayweather.iconsrc ? (
                <img src={dayweather.iconsrc}></img>
              ) : (
                <div></div>
              )}
            </div>
            <div className="space-y-1">
              <div className="font-semibold" style={{ color: "#F9FAFB" }}>
                {dayweather.temp}°C
              </div>
              <div
                className="text-sm"
                style={{ color: "rgba(167, 205, 201, 0.7)" }}
              >
                {dayweather.humidity}%
              </div>
              <div className="text-xs" style={{ color: "#86A6BB" }}>
                {dayweather.windspeed} m/s
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastWeatherSection;
