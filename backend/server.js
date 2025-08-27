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
const optionalEnvVars = ['NEWS_API_KEY', 'NEWS_GUARDIAN_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Warn about missing optional environment variables
const missingOptionalEnvVars = optionalEnvVars.filter(envVar => !process.env[envVar]);
if (missingOptionalEnvVars.length > 0) {
  console.warn('Missing optional environment variables (news features may not work):', missingOptionalEnvVars);
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

// News API endpoint (NewsAPI.org)
app.get('/api/getnews', async (req, res) => {
  try {
    const { country, category = 'general', pageSize = 10 } = req.query;

    if (!country) {
      return res.status(400).json({
        success: false,
        error: 'Country parameter is required'
      });
    }

    // Validate country code (2-letter ISO code)
    const countryCode = country.trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(countryCode)) {
      return res.status(400).json({
        success: false,
        error: 'Country must be a valid 2-letter country code (e.g., "us", "in", "gb")'
      });
    }

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'News service not configured'
      });
    }

    const newsUrl = `https://newsapi.org/v2/top-headlines?country=${countryCode}&category=${category}&pageSize=${pageSize}&apiKey=${apiKey}`;

    console.log(`Fetching news for country: ${countryCode}`);
    
    const newsResponse = await fetch(newsUrl);
    
    if (!newsResponse.ok) {
      if (newsResponse.status === 401) {
        return res.status(500).json({
          success: false,
          error: 'News service configuration error'
        });
      } else if (newsResponse.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.'
        });
      }
      return res.status(502).json({
        success: false,
        error: 'News service temporarily unavailable'
      });
    }

    const newsData = await newsResponse.json();

    if (newsData.status !== 'ok') {
      return res.status(502).json({
        success: false,
        error: 'News service returned an error'
      });
    }

    // Transform and filter articles
    const articles = newsData.articles
      .filter(article => article.title && article.title !== '[Removed]')
      .map((article, index) => ({
        id: `newsapi_${index}_${Date.now()}`,
        title: article.title,
        description: article.description,
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source.name,
        author: article.author
      }));

    const responseData = {
      success: true,
      data: {
        country: countryCode.toUpperCase(),
        category,
        totalResults: newsData.totalResults,
        articles,
        // Include raw data for debugging
        raw: newsData
      },
      timestamp: new Date().toISOString()
    };

    res.json(responseData);

  } catch (error) {
    console.error('News API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Guardian News API endpoint
app.get('/api/getnews-guardian', async (req, res) => {
  try {
    const { country, pageSize = 10, orderBy = 'relevance' } = req.query;

    if (!country) {
      return res.status(400).json({
        success: false,
        error: 'Country parameter is required'
      });
    }

    // Validate country code (2-letter ISO code)
    const countryCode = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return res.status(400).json({
        success: false,
        error: 'Country must be a valid 2-letter country code (e.g., "US", "IN", "GB")'
      });
    }

    const apiKey = process.env.NEWS_GUARDIAN_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Guardian news service not configured'
      });
    }

    // Convert country code to country name for Guardian API
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    let countryName;
    try {
      countryName = regionNames.of(countryCode);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid country code'
      });
    }

    const guardianUrl = `https://content.guardianapis.com/search?q=${encodeURIComponent(countryName)}&api-key=${apiKey}&show-fields=thumbnail,trailText&order-by=${orderBy}&page-size=${pageSize}`;

    console.log(`Fetching Guardian news for: ${countryName} (${countryCode})`);
    
    const guardianResponse = await fetch(guardianUrl);
    
    if (!guardianResponse.ok) {
      if (guardianResponse.status === 401 || guardianResponse.status === 403) {
        return res.status(500).json({
          success: false,
          error: 'Guardian news service configuration error'
        });
      } else if (guardianResponse.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.'
        });
      }
      return res.status(502).json({
        success: false,
        error: 'Guardian news service temporarily unavailable'
      });
    }

    const guardianData = await guardianResponse.json();

    if (guardianData.response.status !== 'ok') {
      return res.status(502).json({
        success: false,
        error: 'Guardian news service returned an error'
      });
    }

    // Transform Guardian articles
    const articles = guardianData.response.results.map((article) => ({
      id: article.id,
      title: article.webTitle,
      description: article.fields?.trailText || null,
      url: article.webUrl,
      imageUrl: article.fields?.thumbnail || null,
      publishedAt: article.webPublicationDate,
      source: 'The Guardian',
      section: article.sectionName
    }));

    const responseData = {
      success: true,
      data: {
        country: countryCode,
        countryName,
        totalResults: guardianData.response.total,
        articles,
        // Include raw data for debugging
        raw: guardianData
      },
      timestamp: new Date().toISOString()
    };

    res.json(responseData);

  } catch (error) {
    console.error('Guardian News API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Combined news endpoint (tries Guardian first, falls back to NewsAPI)
app.get('/api/getnews-combined', async (req, res) => {
  try {
    const { country, pageSize = 10 } = req.query;

    if (!country) {
      return res.status(400).json({
        success: false,
        error: 'Country parameter is required'
      });
    }

    // Try Guardian API first
    try {
      const guardianUrl = `/api/getnews-guardian?country=${country}&pageSize=${pageSize}`;
      const guardianResponse = await fetch(`http://localhost:${PORT}${guardianUrl}`);
      
      if (guardianResponse.ok) {
        const guardianData = await guardianResponse.json();
        if (guardianData.success && guardianData.data.articles.length > 0) {
          // Add source indicator
          guardianData.data.source = 'guardian';
          return res.json(guardianData);
        }
      }
    } catch (guardianError) {
      console.log('Guardian API failed, trying NewsAPI...', guardianError.message);
    }

    // Fallback to NewsAPI
    try {
      const newsApiUrl = `/api/getnews?country=${country}&pageSize=${pageSize}`;
      const newsApiResponse = await fetch(`http://localhost:${PORT}${newsApiUrl}`);
      
      if (newsApiResponse.ok) {
        const newsApiData = await newsApiResponse.json();
        if (newsApiData.success) {
          // Add source indicator
          newsApiData.data.source = 'newsapi';
          return res.json(newsApiData);
        }
      }
    } catch (newsApiError) {
      console.log('NewsAPI also failed:', newsApiError.message);
    }

    // Both failed
    return res.status(502).json({
      success: false,
      error: 'All news services are temporarily unavailable'
    });

  } catch (error) {
    console.error('Combined News API Error:', error);
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