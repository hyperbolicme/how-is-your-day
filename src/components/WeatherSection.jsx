import {React, useState} from "react";

function WeatherSection() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);

  async function getWeather(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    const query = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : ", query);
    const res = await fetch(query);

    const data = await res.json();
    console.log("weather data: ", data);
    setWeather(data);
  }

  const handleGetWeather = () => {
    console.log("city = ", city);
    getWeather(city);
  };

  return (
    <div>
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
            <div className="text-primarytwo text-left">
              <p className="text-xs"> {weather.name}</p>
              <p className="text-accenttwo text-2xl lg:text-4xl">
                {weather.main.temp}°C
              </p>
              <p>{weather.weather[0].description}</p>
            </div>
          )}
        </div>
      </div>
    </section>
    </div>
  );
}

export default WeatherSection;
