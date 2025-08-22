import React, { useState } from 'react';
import { Search, Sun, Cloud, CloudRain, Wind, Eye, Droplets, MapPin, Calendar, Clock, TrendingUp } from 'lucide-react';

const WeatherNewsApp = () => {
  const [city, setCity] = useState('');
  const [currentCity, setCurrentCity] = useState('New York');
  const [isLoading, setIsLoading] = useState(false);

  // Mock weather data
  const mockWeatherData = {
    current: {
      temp: 72,
      condition: 'Partly Cloudy',
      icon: 'partly-cloudy',
      humidity: 65,
      windSpeed: 8,
      visibility: 10,
      feelsLike: 76
    },
    forecast: [
      { day: 'Today', high: 75, low: 62, condition: 'Partly Cloudy', icon: 'partly-cloudy', precipitation: 10 },
      { day: 'Tomorrow', high: 78, low: 64, condition: 'Sunny', icon: 'sunny', precipitation: 5 },
      { day: 'Wednesday', high: 73, low: 59, condition: 'Rainy', icon: 'rainy', precipitation: 80 },
      { day: 'Thursday', high: 71, low: 57, condition: 'Cloudy', icon: 'cloudy', precipitation: 20 },
      { day: 'Friday', high: 76, low: 61, condition: 'Sunny', icon: 'sunny', precipitation: 0 }
    ]
  };

  // Mock news data
  const mockNewsData = [
    {
      headline: "Tech Giants Announce Major AI Breakthrough",
      blurb: "Leading technology companies reveal collaborative research that could revolutionize artificial intelligence applications across industries.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop",
      time: "2 hours ago"
    },
    {
      headline: "Climate Summit Reaches Historic Agreement",
      blurb: "World leaders commit to ambitious new targets for carbon neutrality, marking a significant step in global climate action.",
      image: "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=400&h=250&fit=crop",
      time: "4 hours ago"
    },
    {
      headline: "Space Exploration Milestone Achieved",
      blurb: "International space agencies successfully complete groundbreaking mission that opens new possibilities for deep space research.",
      image: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=250&fit=crop",
      time: "6 hours ago"
    }
  ];

  const getWeatherIcon = (iconType) => {
    switch (iconType) {
      case 'sunny': return <Sun className="w-8 h-8" style={{color: '#86BBB5'}} />;
      case 'partly-cloudy': return <Cloud className="w-8 h-8" style={{color: '#A7CDC9'}} />;
      case 'cloudy': return <Cloud className="w-8 h-8" style={{color: '#86A6BB'}} />;
      case 'rainy': return <CloudRain className="w-8 h-8" style={{color: '#49799C'}} />;
      default: return <Sun className="w-8 h-8" style={{color: '#86BBB5'}} />;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim()) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        setCurrentCity(city);
        setCity('');
        setIsLoading(false);
      }, 800);
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

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #1A4D47 0%, #2D5F5A 35%, #1A3A52 70%, #2D4A5F 100%)'}}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{backgroundColor: '#86BBB5'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 opacity-15 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" style={{backgroundColor: '#86A6BB'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{background: 'linear-gradient(135deg, #F9FAFB 0%, #A7CDC9 50%, #A7BECD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
            How is your day
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
                    {getWeatherIcon(mockWeatherData.current.icon)}
                    <div>
                      <div className="text-5xl font-bold" style={{color: '#F9FAFB'}}>{mockWeatherData.current.temp}°</div>
                      <div style={{color: '#A7CDC9'}}>{mockWeatherData.current.condition}</div>
                      <div className="text-sm" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Feels like {mockWeatherData.current.feelsLike}°</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="rounded-xl p-3" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)'}}>
                      <Droplets className="w-5 h-5 mx-auto mb-1" style={{color: '#86A6BB'}} />
                      <div className="text-sm" style={{color: '#F9FAFB'}}>{mockWeatherData.current.humidity}%</div>
                      <div className="text-xs" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Humidity</div>
                    </div>
                    <div className="rounded-xl p-3" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)'}}>
                      <Wind className="w-5 h-5 mx-auto mb-1" style={{color: '#86BBB5'}} />
                      <div className="text-sm" style={{color: '#F9FAFB'}}>{mockWeatherData.current.windSpeed} mph</div>
                      <div className="text-xs" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Wind</div>
                    </div>
                    <div className="rounded-xl p-3" style={{backgroundColor: 'rgba(167, 205, 201, 0.1)'}}>
                      <Eye className="w-5 h-5 mx-auto mb-1" style={{color: '#A7BECD'}} />
                      <div className="text-sm" style={{color: '#F9FAFB'}}>{mockWeatherData.current.visibility} mi</div>
                      <div className="text-xs" style={{color: 'rgba(167, 205, 201, 0.7)'}}>Visibility</div>
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
                  {mockWeatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center rounded-xl p-4 hover:bg-opacity-20 transition-colors" style={{backgroundColor: 'rgba(167, 205, 201, 0.05)'}}>
                      <div className="text-sm font-medium mb-3" style={{color: '#A7CDC9'}}>{day.day}</div>
                      <div className="flex justify-center mb-3">
                        {getWeatherIcon(day.icon)}
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold" style={{color: '#F9FAFB'}}>{day.high}°</div>
                        <div className="text-sm" style={{color: 'rgba(167, 205, 201, 0.7)'}}>{day.low}°</div>
                        <div className="text-xs" style={{color: '#86A6BB'}}>{day.precipitation}%</div>
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
                  {mockNewsData.map((article, index) => (
                    <div key={index} className="group cursor-pointer">
                      <div className="aspect-video rounded-xl overflow-hidden mb-3 group-hover:bg-opacity-20 transition-colors" style={{backgroundColor: 'rgba(167, 190, 205, 0.05)'}}>
                        <img 
                          src={article.image} 
                          alt={article.headline}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold leading-snug group-hover:opacity-80 transition-colors" style={{color: '#F9FAFB'}}>
                          {article.headline}
                        </h4>
                        <p className="text-sm leading-relaxed" style={{color: 'rgba(167, 190, 205, 0.8)'}}>{article.blurb}</p>
                        <div className="text-xs" style={{color: 'rgba(167, 190, 205, 0.6)'}}>{article.time}</div>
                      </div>
                      {index < mockNewsData.length - 1 && <div className="border-b mt-6" style={{borderColor: 'rgba(167, 190, 205, 0.1)'}}></div>}
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