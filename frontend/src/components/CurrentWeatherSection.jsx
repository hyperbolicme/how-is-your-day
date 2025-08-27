import {
  Wind,
  Droplets,
  MapPin,
  Clock,
  Sunrise,
  Sunset,
} from "lucide-react";

import {
  getCurrentTime,
  getCurrentDate,
  getLocalTime
} from "../hooks/Utilities";

const CurrentWeatherSection = ({ currentCity, weather }) => {
  function getWeatherIconImgUrl() {
    return weather?.weather[0]?.icon
      ? `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
      : "https://openweathermap.org/img/wn/01d@2x.png";
  }

  function getFeelsLikeTemperature() {
    return Math.round(weather?.main?.feels_like);
  }

  function getHumidity() {
    return weather?.main?.humidity;
  }

  function getWindspeed() {
    return weather?.wind?.speed;
  }

  function getSunrise() {
    return getLocalTime(weather?.sys?.sunrise);
  }

  function getSunset() {
    return getLocalTime(weather?.sys?.sunset);
  }

  function getWeatherDescription() {
    weather?.weather[0]?.description?.charAt(0).toUpperCase() +
      weather?.weather[0]?.description?.slice(1);
  }

  return (
    <div
      className="backdrop-blur-lg border rounded-3xl p-8"
      style={{
        backgroundColor: "rgba(167, 205, 201, 0.1)",
        borderColor: "rgba(167, 205, 201, 0.2)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5" style={{ color: "#A7CDC9" }} />
          <h2 className="text-2xl font-semibold" style={{ color: "#F9FAFB" }}>
            {currentCity}
          </h2>
        </div>
        <div className="text-right">
          <div
            className="flex items-center space-x-2"
            style={{ color: "#A7CDC9" }}
          >
            <Clock className="w-4 h-4" />
            <span>{getCurrentTime()}</span>
          </div>
          <div
            className="text-sm"
            style={{ color: "rgba(167, 205, 201, 0.7)" }}
          >
            {getCurrentDate()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={getWeatherIconImgUrl()} alt="weather icon"></img>
          <div>
            <div className="text-5xl font-bold" style={{ color: "#F9FAFB" }}>
              <p className="">{Math.round(weather?.main?.temp)}°C</p>
            </div>
            <div style={{ color: "#A7CDC9" }}>{getWeatherDescription()}</div>
            <div
              className="text-sm"
              style={{ color: "rgba(167, 205, 201, 0.7)" }}
            >
              Feels like {getFeelsLikeTemperature()}°C
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 text-center">
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(167, 205, 201, 0.1)" }}
          >
            <Droplets
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: "#86A6BB" }}
            />
            <div className="text-sm" style={{ color: "#F9FAFB" }}>
              {getHumidity()}%
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(167, 205, 201, 0.7)" }}
            >
              Humidity
            </div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(167, 205, 201, 0.1)" }}
          >
            <Wind
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: "#86BBB5" }}
            />
            <div className="text-sm" style={{ color: "#F9FAFB" }}>
              {getWindspeed()} m/s
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(167, 205, 201, 0.7)" }}
            >
              Wind
            </div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(167, 205, 201, 0.1)" }}
          >
            <Sunrise
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: "#A7BECD" }}
            />
            <div className="text-sm" style={{ color: "#F9FAFB" }}>
              {getSunrise()}
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(167, 205, 201, 0.7)" }}
            >
              Sunrise
            </div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(167, 205, 201, 0.1)" }}
          >
            <Sunset
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: "#A7BECD" }}
            />
            <div className="text-sm" style={{ color: "#F9FAFB" }}>
              {getSunset()}
            </div>
            <div
              className="text-xs"
              style={{ color: "rgba(167, 205, 201, 0.7)" }}
            >
              Sunset
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherSection;
