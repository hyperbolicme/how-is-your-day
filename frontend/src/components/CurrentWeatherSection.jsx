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
  // Don't render if no weather data - prevents flickering
  if (!weather || !weather.main) {
    return (
      <div className="backdrop-blur-lg border rounded-3xl p-8 bg-secondaryone/8 border-secondaryone/15">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-secondaryone/30 rounded"></div>
              <div className="h-8 bg-secondaryone/30 rounded w-32"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-secondaryone/30 rounded w-20 mb-2"></div>
              <div className="h-3 bg-secondaryone/30 rounded w-24"></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-secondaryone/30 rounded"></div>
              <div>
                <div className="h-12 bg-secondaryone/30 rounded w-24 mb-2"></div>
                <div className="h-4 bg-secondaryone/30 rounded w-32 mb-1"></div>
                <div className="h-3 bg-secondaryone/30 rounded w-28"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-xl p-3 bg-secondaryone/5">
                  <div className="w-5 h-5 bg-secondaryone/30 rounded mx-auto mb-2"></div>
                  <div className="h-4 bg-secondaryone/30 rounded w-8 mx-auto mb-1"></div>
                  <div className="h-3 bg-secondaryone/30 rounded w-12 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function getWeatherIconImgUrl() {
    return weather?.weather[0]?.icon
      ? `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
      : "https://openweathermap.org/img/wn/01d@2x.png";
  }

  function getFeelsLikeTemperature() {
    return Math.round(weather?.main?.feels_like) || 0;
  }

  function getHumidity() {
    return weather?.main?.humidity || 0;
  }

  function getWindspeed() {
    return weather?.wind?.speed || 0;
  }

  function getSunrise() {
    return getLocalTime(weather?.sys?.sunrise);
  }

  function getSunset() {
    return getLocalTime(weather?.sys?.sunset);
  }

  // FIX: Added missing return statement
  function getWeatherDescription() {
    const desc = weather?.weather[0]?.description;
    if (!desc) return 'Clear sky';
    return desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return (
    <div className="backdrop-blur-lg border rounded-3xl p-8 bg-secondaryone/8 border-secondaryone/15">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-secondaryone" />
          <h2 className="text-2xl font-semibold text-textlight">
            {currentCity}
          </h2>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 text-secondaryone">
            <Clock className="w-4 h-4" />
            <span>{getCurrentTime()}</span>
          </div>
          <div className="text-sm text-secondaryone/70">
            {getCurrentDate()}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <img src={getWeatherIconImgUrl()} alt="weather icon" />
          <div>
            <div className="text-5xl font-bold text-textlight">
              <p>{Math.round(weather?.main?.temp) || 0}°C</p>
            </div>
            <div className="text-secondaryone">{getWeatherDescription()}</div>
            <div className="text-sm text-secondaryone/70">
              Feels like {getFeelsLikeTemperature()}°C
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 text-center">
          <div className="rounded-xl p-3 bg-secondaryone/5">
            <Droplets className="w-5 h-5 mx-auto mb-1 text-secondarytwo" />
            <div className="text-sm text-textlight">
              {getHumidity()}%
            </div>
            <div className="text-xs text-secondaryone/70">
              Humidity
            </div>
          </div>
          <div className="rounded-xl p-3 bg-secondaryone/5">
            <Wind className="w-5 h-5 mx-auto mb-1 text-primaryonelight" />
            <div className="text-sm text-textlight">
              {getWindspeed()} m/s
            </div>
            <div className="text-xs text-secondaryone/70">
              Wind
            </div>
          </div>
          <div className="rounded-xl p-3 bg-secondaryone/5">
            <Sunrise className="w-5 h-5 mx-auto mb-1 text-secondarytwo" />
            <div className="text-sm text-textlight">
              {getSunrise()}
            </div>
            <div className="text-xs text-secondaryone/70">
              Sunrise
            </div>
          </div>
          <div className="rounded-xl p-3 bg-secondaryone/5">
            <Sunset className="w-5 h-5 mx-auto mb-1 text-secondarytwo" />
            <div className="text-sm text-textlight">
              {getSunset()}
            </div>
            <div className="text-xs text-secondaryone/70">
              Sunset
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeatherSection;