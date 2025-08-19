import { React, useState } from "react";

function WeatherSection({setCountry}) {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [iconStr, setIconStr] = useState("");

  console.log("setCountry :", setCountry);
  async function getWeather(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    const query = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : ", query);

    try{
      const res = await fetch(query);
      if(!res.ok) throw new Error("Weather API failed.")
      const data = await res.json();
      console.log("weather data: ", data);
      
      setWeather(data);
      setCountry(data.sys.country);
      console.log("country =", data.sys.country);
      setIconStr(`https://openweathermap.org/img/w/${data.weather[0].icon}.png`);
  
    } catch (error) {
      console.error('Error fetching weather:', error);
      // show error to user #bugfix
    }
  }

  const handleGetWeather = () => {
    if(!city.trim()) {
      console.error("No city entered by user.");
      // show error to user #bugfix
      return;
    }
    console.log("city = ", city);
    getWeather(city);
  };

  return (
    <section className="min-h-screen flex items-start justify-start bg-secondarytwo">
      <div className="px-40 py-10 gap-16">
        <div className="text-left py-10">
          <h1 className="float-animate text-accenttwo font-poiret font-bold text-3xl lg:text-5xl">
            Weather
          </h1>
          {/* <form onSubmit={handleGetWeather}> */}
          <input
            className="w-full px-0 py-3 bg-transparent text-primarytwo border-0 border-b-2 border-gray-300 focus:border-primarytwo focus:outline-none transition-colors"
            type="text"
            placeholder="Enter city... eg. Kochi"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <div className="px-0 py-3">
            <button
              onClick={handleGetWeather}
              className="w-full bg-primarytwo text-gray-300 px-4 py-2 rounded-lg hover:bg-accenttwo"
            >
              How is your day?
            </button>
          </div>
          {/* </form> */}
        </div>
        <div>
          {weather && weather.main && (
            <div className="bg-gray-300 rounded-2xl shadow-lg px-6 py-4 ">
              <div className="text-primarytwo text-left">
                <p className="text-xs">
                  {" "}
                  {weather.name}, {weather.sys.country}
                </p>
                <div className="text-s grid grid-cols-1 lg:grid-cols-2">
                  <p>Min: {weather.main.temp_min}°C</p>
                  <p>Max: {weather.main.temp_max}°C</p>
                </div>
                <div></div>
                <p className="text-accenttwo text-2xl lg:text-4xl">
                  {weather.main.temp}°C
                  <img src={iconStr} alt="weather icon"></img>
                </p>

                <p>Feels like {weather.main.feels_like}°C</p>
                <p>
                  {weather.weather[0].description.charAt(0).toUpperCase() +
                    weather.weather[0].description.slice(1)}
                </p>
                <p className="text-sm">Humidity: {weather.main.humidity}%</p>
                <p className="text-sm">Wind: {weather.wind.speed}m/s</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default WeatherSection;
