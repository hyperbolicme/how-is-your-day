// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Environment variables validation
const requiredEnvVars = ['WEATHER_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Weather API endpoint
app.get('/api/getweather', async (req, res) => {
  try {
    const { city } = req.query;

    // Validation
    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'City parameter is required'
      });
    }

    if (typeof city !== 'string' || city.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'City must be a valid non-empty string'
      });
    }

    // Sanitize input
    const sanitizedCity = city.trim();

    // Make API call to OpenWeatherMap
    const apiKey = process.env.WEATHER_API_KEY;
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(sanitizedCity)}&appid=${apiKey}&units=metric`;

    console.log(`Fetching weather for: ${sanitizedCity}`);
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      // Handle different error status codes
      if (weatherResponse.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'City not found'
        });
      } else if (weatherResponse.status === 401) {
        return res.status(500).json({
          success: false,
          error: 'Weather service configuration error'
        });
      } else {
        return res.status(502).json({
          success: false,
          error: 'Weather service temporarily unavailable'
        });
      }
    }

    const weatherData = await weatherResponse.json();

    // Transform and send response
    const responseData = {
      success: true,
      data: {
        city: weatherData.name,
        country: weatherData.sys.country,
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        sunrise: weatherData.sys.sunrise,
        sunset: weatherData.sys.sunset,
        coords: {
          lat: weatherData.coord.lat,
          lon: weatherData.coord.lon
        },
        // Include raw data for additional processing if needed
        raw: weatherData
      },
      timestamp: new Date().toISOString()
    };

    res.json(responseData);

  } catch (error) {
    console.error('Weather API Error:', error);
    
    // Don't expose internal errors to client
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Forecast API endpoint
app.get('/api/getforecast', async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'City parameter is required'
      });
    }

    const sanitizedCity = city.trim();
    const apiKey = process.env.WEATHER_API_KEY;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(sanitizedCity)}&appid=${apiKey}&units=metric`;

    console.log(`Fetching forecast for: ${sanitizedCity}`);
    
    const forecastResponse = await fetch(forecastUrl);
    
    if (!forecastResponse.ok) {
      if (forecastResponse.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'City not found'
        });
      }
      return res.status(502).json({
        success: false,
        error: 'Forecast service temporarily unavailable'
      });
    }

    const forecastData = await forecastResponse.json();

    // Filter to get daily forecasts (12:00 PM entries)
    const dailyForecasts = forecastData.list.filter(item => 
      item.dt_txt.includes('12:00:00')
    );

    const responseData = {
      success: true,
      data: {
        city: forecastData.city.name,
        country: forecastData.city.country,
        forecasts: dailyForecasts.map(day => ({
          date: day.dt_txt,
          temperature: Math.round(day.main.temp),
          humidity: day.main.humidity,
          windSpeed: day.wind.speed,
          description: day.weather[0].description,
          icon: day.weather[0].icon
        })),
        // Include raw data
        raw: forecastData
      },
      timestamp: new Date().toISOString()
    };

    res.json(responseData);

  } catch (error) {
    console.error('Forecast API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Weather API server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌤️  Weather API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌡️  Weather endpoint: http://localhost:${PORT}/api/getweather?city=<cityname>`);
});

module.exports = app;