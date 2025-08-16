import { useState } from 'react'

function App() {

  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);


  const getWeather = async () => {
    const apiKey = "084eb917b9dc378934d053e9f0261348";
    // setCity("kochi");
    // console.log("city: ", city);
    const cityName = "kochi"
    const query = "https://api.openweathermap.org/data/2.5/weather?q="
                    +cityName
                    +"&appid="+apiKey+"&units=metric";
    console.log("query : ", query);
    const res = await fetch(query);

    const data = await res.json();
    console.log("weather data: ", data);
    setWeather(data);
  };


  return (
    <div className="min-h-screen font-mont">
      <section className="h-screen/3 min-h-[33vh] flex items-end justify-center bg-secondarytwo">
        <div className="text-center py-10">
          <h1 className="text-primarytwo font-poiret font-bold text-3xl">
            Weather
          </h1>
            <input
              type="text"
              placeholder="Enter city... eg. Kochi"
              className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <button
              onClick={getWeather}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Get Weather
            </button>
          {weather && weather.main && (
            <div>
              <p>city {weather.name}</p>
              <p>{weather.main.temp}oC</p>
              <p>{weather.weather[0].description}</p>
            </div>
          )}
        </div>
      </section>
      <section className="min-h-[67vh] flex items-start justify-start bg-secondaryone ">
        <div className="px-40 py-10">
          <h1 className="text-primaryone font-poiret font-bold text-3xl">
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

export default App
