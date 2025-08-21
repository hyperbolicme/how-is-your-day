import React from "react";
import WeatherCard from "./WeatherCard";

function ForecastSection({ forecast }) {
  if (forecast && forecast.list) {
    let weatherList = forecast.list;

    weatherList = weatherList.filter((item) =>
      item.dt_txt.includes("12:00:00")
    );
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 ">
        {weatherList.map((weather, index) => (
          <div className="py-3 px-1">
            <WeatherCard
              weather={weather}
              iconStr={`https://openweathermap.org/img/wn/${weather?.weather[0]?.icon}@2x.png`}
              id={index}
              city={forecast.city?.name}
              countryCode={forecast.city.country}
              date={weather.dt_txt}
            />
          </div>
        ))}
      </div>
    );
  } else <p>Enter valid city.</p>;
}

export default ForecastSection;
