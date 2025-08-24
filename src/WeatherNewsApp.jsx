import React, { useEffect, useRef, useState } from 'react';
import { Search, Sun, Cloud, CloudRain, Wind, Eye, Droplets, MapPin, Calendar, Clock, TrendingUp, Sunrise, Sunset } from 'lucide-react';

const DEFAULT_CITY = "Kochi";
const DEFAULT_COUNTRY = "IN";
const MAX_ARTICLES = 10;

const WeatherNewsApp = () => {
  const [city, setCity] = useState('');
  const [currentCity, setCurrentCity] = useState(DEFAULT_CITY);
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [forecastList, setForecastList] = useState(null);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    console.log("handleSearch")
    e.preventDefault();
    if (city.trim()) {
      setIsLoading(true);
      
      setCurrentCity(city);
      try { 
        await Promise.all([getWeather(currentCity), getForecast(currentCity), getNews(country)]);           
      } catch(error) {
        console.error("Error getting weather :", error)
      } finally {
        setCity('');
        setIsLoading(false);
      }
    }
  };

  async function getWeather(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const query = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : WeatherAPI");

    try {
      // setIsLoading(true);
      const res = await fetch(query);
      if (!res.ok) throw new Error("Weather API failed.");
      const data = await res.json();
      console.log("weather data: ", data);

      setWeather(data);
      setCountry(data.sys.country);
    } catch (error) {
      console.error("Error fetching weather:", error);
      // show error to user #bugfix
    } finally {
      // setIsLoading(false);
    }
  };

  async function getForecast(city) {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    const query = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    console.log("query : ForecastAPI");

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("Forecast API failed.");
      const data = await res.json();
      console.log("forecast data: ", data);

      setForecast(data);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      // show error to user #bugfix
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLocalTime = (unixtime) => {
    const d = new Date(unixtime*1000);
    const formattedString = `${d.getHours()}:${d.getMinutes()}`;

    return formattedString;
  };

  const getDayOfWeek = (str) => {
    const today = new Date();
    const givenDay = new Date(str);
    const diff = givenDay.getTime() - today.getTime(); // in ms
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));

    if(diffDays == 0) {
      return "Today";
    } else if(diffDays == 1){
      return "Tomorrow";
    } else if(diffDays > 1) {
      switch(givenDay.getDay()) {
        case 0: return("Sunday");
        case 1: return("Monday");
        case 2: return("Tuesday");
        case 3: return("Wednesday");
        case 4: return("Thursday");
        case 5: return("Friday");
        case 6: return("Saturday");
      }
    }
  };

  async function getNews(country) {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    const query = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apiKey}`;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("News API failed");
      const data = await res.json();

      console.log("api string: NewsAPI");
      console.log("news :", data);

      setNews(data);
      // setUserInput(false);
    } catch (error) {
      console.error("Error fetching news: ", error);
      setError("Failed to fetch news. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return; // 
    setIsLoading(true);

    console.log("currentCity changed to :", currentCity);
    getWeather(currentCity);
    getForecast(currentCity);
    setIsLoading(false);
  }, [currentCity]); 

  useEffect(() => {
    if (isLoading) return; //
    setIsLoading(true); 
    console.log("country changed to :", country);
    getNews(country);
    setIsLoading(false)
  }, [country]);

  useEffect(() => {
    if(!forecast) return;
    setForecastList(forecast.list.filter((item) => item.dt_txt.includes("12:00:00")));
  }, [forecast]);

  return (
    <div className="min-h-screen font-mont" style={{background: 'linear-gradient(135deg, #1A4D47 0%, #2D5F5A 35%, #1A3A52 70%, #2D4A5F 100%)'}}>
      {/* Animated background elements */}
      {/* <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{backgroundColor: '#86BBB5'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 opacity-15 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" style={{backgroundColor: '#86A6BB'}}></div>
      </div> */}
      <button id="dummyButtonRef" onClick={handleSearch} className='invisible'> dummy button </button>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{background: 'linear-gradient(135deg, #F9FAFB 0%, #A7CDC9 50%, #A7BECD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
            How is your day?
          </h1>
          <p className="text-lg" style={{color: '#A7CDC9'}}>Weather insights and top stories for your city</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
              placeholder="Enter city name..."
              className="w-full px-6 py-4 backdrop-blur-md border rounded-2xl focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'rgba(167, 205, 201, 0.1)',
                borderColor: 'rgba(167, 205, 201, 0.3)',
                color: '#F9FAFB',
                '::placeholder': { color: 'rgba(167, 205, 201, 0.7)' }
              }}
            />
            <button 
              onClick={handleSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 transition-colors"
              style={{color: 'rgba(167, 205, 201, 0.8)'}}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-4" style={{borderColor: 'rgba(167, 205, 201, 0.2)', borderTopColor: '#A7CDC9'}}></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Weather Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Weather */}
              <div className="backdrop-blur-lg border rounded-3xl p-8" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)', borderColor: 'rgba(167, 205, 201, 0.2)'}}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5" style={{color: '#A7CDC9'}} />
                    <h2 className="text-2xl font-semibold" style={{color: '#F9FAFB'}}>{currentCity}</h2>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2" style={{color: '#A7CDC9'}}>
                      <Clock className="w-4 h-4" />
                      <span>{getCurrentTime()}</span>
                    </div>
                    <div className="text-sm" style={{color: 'rgba(167, 205, 201, 0.7)'}}>{getCurrentDate()}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    
                    
                    {weather?.weather[0]?.icon ? (<img src={`https://openweathermap.org/img/wn/${weather?.weather[0]?.icon}@2x.png`} alt="weather icon"></img>) : <></>}
                    <div>
                      <div className="text-5xl font-bold" style={{color: '#F9FAFB'}}>
                        <p className="">
                          {Math.round(weather?.main?.temp)}°C
                        </p>
                      </div>
                      <div style={{color: '#A7CDC9'}}>
                        { weather?.weather[0]?.description?.charAt(0).toUpperCase() +
                          weather?.weather[0]?.description?.slice(1)}
                          </div>
                      <div className="text-sm" style={{color: 'rgba(167, 205, 201, 0.7)'}}>
                        Feels like {Math.round(weather?.main?.feels_like)}°C
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div className="rounded-xl p-3" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)'}}>
                      <Droplets className="w-5 h-5 mx-auto mb-1" style={{color: '#86A6BB'}} />
                      <div className="text-sm" style={{color: '#F9FAFB'}}>{weather?.main?.humidity}%</div>
                      <div className="text-xs" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Humidity</div>
                    </div>
                    <div className="rounded-xl p-3" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)'}}>
                      <Wind className="w-5 h-5 mx-auto mb-1" style={{color: '#86BBB5'}} />
                      <div className="text-sm" style={{color: '#F9FAFB'}}>{weather?.wind?.speed} m/s</div>
                      <div className="text-xs" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Wind</div>
                    </div>
                    <div className="rounded-xl p-3" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)'}}>
                      <Sunrise className="w-5 h-5 mx-auto mb-1" style={{color: '#A7BECD'}} />
                      <div className="text-sm" style={{color: '#F9FAFB'}}>{getLocalTime(weather?.sys?.sunrise)}</div>
                      <div className="text-xs" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Sunrise</div>
                    </div>
                    <div className="rounded-xl p-3" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)'}}>
                      <Sunset className="w-5 h-5 mx-auto mb-1" style={{color: '#A7BECD'}} />
                      <div className="text-sm" style={{color: '#F9FAFB'}}>{getLocalTime(weather?.sys?.sunset)}</div>
                      <div className="text-xs" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Sunset</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div className="backdrop-blur-lg border rounded-3xl p-8" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)', borderColor: 'rgba(167, 205, 201, 0.2)'}}>
                <div className="flex items-center space-x-3 mb-6">
                  <Calendar className="w-6 h-6" style={{color: '#A7CDC9'}} />
                  <h3 className="text-xl font-semibold" style={{color: '#F9FAFB'}}>5-Day Forecast</h3>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {forecastList?.map((dayweather, index) => (
                    <div key={index} className="text-center rounded-xl p-4 hover:bg-opacity-20 transition-colors" style={{backgroundColor: 'rgba(167, 205, 201, 0.05)'}}>
                      <div className="text-sm font-medium mb-3" style={{color: '#A7CDC9'}}>{getDayOfWeek(dayweather.dt_txt)}</div>
                      <div className="flex justify-center mb-3">
                        {dayweather?.weather[0]?.icon ? (<img src={`https://openweathermap.org/img/wn/${dayweather?.weather[0]?.icon}@2x.png`}></img>) : <div></div> }
                        
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold" style={{color: '#F9FAFB'}}>{Math.round(dayweather?.main?.temp)}°C</div>
                        <div className="text-sm" style={{color: 'rgba(167, 205, 201, 0.7)'}}>{dayweather?.main?.humidity}%</div>
                        <div className="text-xs" style={{color: '#86A6BB'}}>{dayweather?.wind?.speed} m/s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* News Section */}
            <div className="space-y-6">
              <div className="backdrop-blur-lg border rounded-3xl p-8" style={{backgroundColor: 'rgba(167, 190, 205, 0.1)', borderColor: 'rgba(167, 190, 205, 0.2)'}}>
                <div className="flex items-center space-x-3 mb-6">
                  <TrendingUp className="w-6 h-6" style={{color: '#A7BECD'}} />
                  <h3 className="text-xl font-semibold" style={{color: '#F9FAFB'}}>Today's Top News</h3>
                </div>
                <div className="space-y-6">
                  {news?.articles?.map((article, index) => (
                    (index < MAX_ARTICLES) &&
                    <div key={index} className="group cursor-pointer">
                      <div className="aspect-video rounded-xl overflow-hidden mb-3 group-hover:bg-opacity-20 transition-colors" style={{backgroundColor: 'rgba(167, 190, 205, 0.05)'}}>
                        <img 
                          alt={article?.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          src={article?.urlToImage}
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold leading-snug group-hover:opacity-80 transition-colors" style={{color: '#F9FAFB'}}>
                          {article?.title}
                        </h4>
                        <p className="text-sm leading-relaxed" style={{color: 'rgba(167, 190, 205, 0.8)'}}>{article?.description}</p>
                        {/* <div className="text-xs" style={{color: 'rgba(167, 190, 205, 0.6)'}}>{article.time}</div> */}
                      </div>
                      {index < MAX_ARTICLES-1 && <div className="border-b mt-6" style={{borderColor: 'rgba(167, 190, 205, 0.1)'}}></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherNewsApp;