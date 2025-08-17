import { useState } from "react";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);

  const getWeather = async () => {
    const apiKey = "084eb917b9dc378934d053e9f0261348";
    // setCity("kochi");
    // console.log("city: ", city);
    const cityName = "new york";
    const query =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      cityName +
      "&appid=" +
      apiKey +
      "&units=metric";
    console.log("query : ", query);
    const res = await fetch(query);

    const data = await res.json();
    console.log("weather data: ", data);
    setWeather(data);
  };

  return (
    <div className="min-h-screen font-mont">
      <section className="h-screen/3 min-h-[33vh] flex items-start justify-start bg-secondarytwo">
        <div className="px-40 py-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="text-left py-10">
            <h1 className="text-thirdtwo font-poiret font-bold text-3xl lg:text-5xl">
              Weather
            </h1>
            <input
              type="text"
              placeholder="Enter city... eg. Kochi"
              className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-300 focus:border-primarytwo focus:outline-none transition-colors"
            />
            <div className="px-0 py-3">
              <button
                onClick={getWeather}
                className="w-full bg-primarytwo text-gray-300 px-4 py-2 rounded-lg hover:bg-thirdtwo"
              >
                How is your day?
              </button>
            </div>
          </div>
          <div>
            {weather && weather.main && (
              <div className="text-primarytwo text-left">
                <p className="text-xs"> {weather.name}</p>
                <p className="text-thirdtwo text-2xl lg:text-4xl">{weather.main.temp}°C</p>
                <p>{weather.weather[0].description}</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="min-h-[67vh] flex items-start justify-start bg-secondaryone ">
        <div className="px-40 py-10">
          <h1 className="text-primaryone font-poiret font-bold text-3xl lg:text-5xl">
            News
          </h1>
          <p className="font-bold"> Headline</p>
          <p> News blurb and link</p>
          <p className="font-bold"> Headline</p>
          <p> News blurb and link</p>
          <p className="font-bold"> Headline</p>
          <p> News blurb and link</p>
        </div>
      </section>
    </div>
  );
}

export default App;
