// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const fsSync = require('fs'); 
const path = require('path');
const AWS = require('aws-sdk');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure AWS SDK (it will use your EC2 instance IAM role)
const s3 = new AWS.S3({
  region: 'ap-south-1' // Your bucket region
});

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const LOCAL_CACHE_DIR = path.join(__dirname, 'cache');
const EBS_CACHE_DIR = '/mnt/data/cache';

// Determine cache directory based on environment
let CACHE_DIR;
if (process.env.NODE_ENV === 'production' || fsSync.existsSync('/mnt/data')) {
  CACHE_DIR = EBS_CACHE_DIR;
  console.log('Using EBS cache directory:', CACHE_DIR);
} else {
  CACHE_DIR = LOCAL_CACHE_DIR;
  console.log('Using local cache directory:', CACHE_DIR);
}

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Ensure cache directory exists
async function initializeCache() {
  try {
    await fs.access(CACHE_DIR);
    console.log('Cache directory exists:', CACHE_DIR);
  } catch (error) {
    console.log('Creating cache directory:', CACHE_DIR);
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Cache utility functions
const cache = {
  // Generate cache key
  generateKey(type, params) {
    const paramString = JSON.stringify(params);
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(paramString).digest('hex');
    return `${type}_${hash}.json`;
  },

  // Read from cache
  async get(key) {
    try {
      const filePath = path.join(CACHE_DIR, key);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      // Check if cache is expired
      if (Date.now() > parsed.expiresAt) {
        console.log(`Cache expired for key: ${key}`);
        await this.delete(key);
        return null;
      }
      
      console.log(`Cache hit for key: ${key}`);
      return parsed.data;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Cache read error:', error);
      }
      return null;
    }
  },

  // Write to cache
  async set(key, data) {
    try {
      const cacheData = {
        data,
        createdAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      };
      
      const filePath = path.join(CACHE_DIR, key);
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
      console.log(`Cache written for key: ${key} (30 min TTL)`);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  },

  // Delete cache entry
  async delete(key) {
    try {
      const filePath = path.join(CACHE_DIR, key);
      await fs.unlink(filePath);
      console.log(`Cache deleted for key: ${key}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Cache delete error:', error);
      }
    }
  }
};

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

// Helper function to check if we're running on EC2 with proper AWS access
async function hasAWSAccess() {
  try {
    // Try to get AWS credentials
    await AWS.config.getCredentials();
    return true;
  } catch (error) {
    console.log('⚠️ AWS credentials not available, will save locally');
    return false;
  }
}

// Helper function to save report locally when AWS isn't available
async function saveReportLocally(report, fileName) {
  try {
    const reportsDir = path.join(__dirname, 'local-reports');
    
    // Create directory if it doesn't exist
    try {
      await fs.access(reportsDir);
    } catch {
      await fs.mkdir(reportsDir, { recursive: true });
    }
    
    const filePath = path.join(reportsDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    
    return filePath;
  } catch (error) {
    throw new Error(`Failed to save report locally: ${error.message}`);
  }
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

    // Check cache first
    const cacheKey = cache.generateKey('weather', { city: sanitizedCity });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Weather cache hit for: ${sanitizedCity}`);
      return res.json(cachedData);
    }

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

    // Cache the response
    await cache.set(cacheKey, responseData);

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

    // Check cache first
    const cacheKey = cache.generateKey('forecast', { city: sanitizedCity });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Forecast cache hit for: ${sanitizedCity}`);
      return res.json(cachedData);
    }

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

    // Cache the response
    await cache.set(cacheKey, responseData);

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

    // Check cache first
    const cacheKey = cache.generateKey('news', { country: countryCode, category, pageSize });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`News cache hit for: ${countryCode}`);
      return res.json(cachedData);
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

    // Cache the response
    await cache.set(cacheKey, responseData);

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

    // Check cache first
    const cacheKey = cache.generateKey('guardian', { country: countryCode, pageSize, orderBy });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Guardian news cache hit for: ${countryCode}`);
      return res.json(cachedData);
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

    // Cache the response
    await cache.set(cacheKey, responseData);

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

    // Check cache first for combined endpoint
    const cacheKey = cache.generateKey('combined', { country, pageSize });
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Combined news cache hit for: ${country}`);
      return res.json(cachedData);
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
          // Cache the combined result
          await cache.set(cacheKey, guardianData);
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
          // Cache the combined result
          await cache.set(cacheKey, newsApiData);
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

app.post('/api/generate-report', async (req, res) => {
  try {
    console.log('🚀 Generating comprehensive daily report...');
    
    const { city = 'Mumbai' } = req.body;
    
    // Check if required environment variables exist
    if (!process.env.WEATHER_API_KEY || !process.env.NEWS_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Missing required API keys. Please check your environment variables.',
        missing: {
          weather_api: !process.env.WEATHER_API_KEY,
          news_api: !process.env.NEWS_API_KEY
        }
      });
    }
    
    console.log(`📊 Fetching data for ${city}...`);
    
    // 1. Fetch weather data with better error handling
    let currentWeather, forecastData;
    
    try {
      console.log('🌤️ Fetching current weather...');
      const weatherResponse = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
      
      if (!weatherResponse.ok) {
        throw new Error(`Weather API returned ${weatherResponse.status}: ${weatherResponse.statusText}`);
      }
      
      currentWeather = await weatherResponse.json();
      console.log('✅ Current weather fetched');
      
      console.log('🌤️ Fetching forecast...');
      const forecastResponse = await fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
      
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API returned ${forecastResponse.status}: ${forecastResponse.statusText}`);
      }
      
      forecastData = await forecastResponse.json();
      console.log('✅ Forecast data fetched');
      
    } catch (weatherError) {
      console.error('❌ Weather API error:', weatherError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch weather data',
        details: weatherError.message
      });
    }
    
    // 2. Fetch news data with error handling
    let newsData;
    
    try {
      console.log('📰 Fetching news...');
      const newsResponse = await fetch(`https://newsapi.org/v2/top-headlines?country=in&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`);
      
      if (!newsResponse.ok) {
        throw new Error(`News API returned ${newsResponse.status}: ${newsResponse.statusText}`);
      }
      
      newsData = await newsResponse.json();
      console.log('✅ News data fetched');
      
    } catch (newsError) {
      console.error('❌ News API error:', newsError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch news data',
        details: newsError.message
      });
    }
    
    // 3. Create comprehensive report
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0];
    const timestampStr = Math.floor(timestamp.getTime() / 1000);
    
    const report = {
      metadata: {
        city: city,
        date: dateStr,
        generated_at: timestamp.toISOString(),
        report_version: '1.0',
        environment: process.env.NODE_ENV || 'development'
      },
      weather: {
        current: {
          temperature: currentWeather.main?.temp || 'N/A',
          feels_like: currentWeather.main?.feels_like || 'N/A',
          humidity: currentWeather.main?.humidity || 'N/A',
          pressure: currentWeather.main?.pressure || 'N/A',
          description: currentWeather.weather?.[0]?.description || 'N/A',
          wind_speed: currentWeather.wind?.speed || 'N/A'
        },
        forecast: forecastData.list?.slice(0, 8).map(item => ({
          datetime: new Date(item.dt * 1000).toISOString(),
          temperature: item.main.temp,
          description: item.weather[0].description,
          humidity: item.main.humidity
        })) || []
      },
      news: {
        headlines: newsData.articles?.slice(0, 5).map(article => ({
          title: article.title,
          description: article.description,
          source: article.source.name,
          published_at: article.publishedAt,
          url: article.url
        })) || [],
        total_articles: newsData.totalResults || 0
      },
      summary: {
        weather_summary: `Current temperature in ${city} is ${currentWeather.main?.temp || 'N/A'}°C with ${currentWeather.weather?.[0]?.description || 'unknown conditions'}`,
        top_news: newsData.articles?.[0]?.title || 'No news available'
      }
    };
    
    const fileName = `${city.toLowerCase()}-${dateStr}-${timestampStr}.json`;
    
    // 4. Save report (S3 if available, local otherwise)
    const hasAWS = await hasAWSAccess();
    let saveResult;
    
    if (hasAWS) {
      // Save to S3
      try {
        console.log('☁️ Saving to S3...');
        const s3Key = `reports/user123/${fileName}`;
        
        const s3Params = {
          Bucket: 'weather-app-reports-hyperbolicme',
          Key: s3Key,
          Body: JSON.stringify(report, null, 2),
          ContentType: 'application/json',
          Metadata: {
            'generated-by': 'weather-app',
            'city': city,
            'date': dateStr
          }
        };
        
        await s3.putObject(s3Params).promise();
        console.log('✅ Report saved to S3');
        
        saveResult = {
          location: 'S3',
          s3_key: s3Key,
          bucket: 'weather-app-reports-hyperbolicme'
        };
        
      } catch (s3Error) {
        console.error('❌ S3 save failed, falling back to local save:', s3Error.message);
        const localPath = await saveReportLocally(report, fileName);
        saveResult = {
          location: 'Local (S3 failed)',
          local_path: localPath,
          s3_error: s3Error.message
        };
      }
    } else {
      // Save locally
      console.log('💾 Saving locally...');
      const localPath = await saveReportLocally(report, fileName);
      console.log('✅ Report saved locally');
      
      saveResult = {
        location: 'Local',
        local_path: localPath,
        note: 'AWS credentials not available - saved to local filesystem'
      };
    }
    
    // 5. Return success response
    res.status(201).json({
      success: true,
      message: 'Daily report generated and stored successfully!',
      report: {
        filename: fileName,
        city: city,
        date: dateStr,
        generated_at: timestamp.toISOString(),
        size_bytes: JSON.stringify(report).length,
        storage: saveResult
      },
      preview: {
        current_temp: report.weather.current.temperature + '°C',
        weather_desc: report.weather.current.description,
        top_headline: report.news.headlines[0]?.title || 'No news available',
        forecast_items: report.weather.forecast.length,
        news_items: report.news.headlines.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    console.error('Full error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      endpoint: '/api/generate-report'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Weather API server is running',
    cacheDir: CACHE_DIR,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify S3 connectivity
app.get('/api/test-s3', async (req, res) => {
  try {
    console.log('🧪 Testing S3 connectivity...');
    
    // List objects in your bucket
    const listParams = {
      Bucket: 'weather-app-reports-hyperbolicme',
      MaxKeys: 10
    };
    
    const result = await s3.listObjectsV2(listParams).promise();
    
    res.json({
      success: true,
      message: 'S3 connection successful!',
      bucket: 'weather-app-reports-hyperbolicme',
      objects_count: result.Contents?.length || 0,
      objects: result.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        last_modified: obj.LastModified
      })) || []
    });
    
  } catch (error) {
    console.error('❌ S3 connectivity test failed:', error);
    res.status(500).json({
      success: false,
      message: 'S3 connection failed',
      error: error.message
    });
  }
});

// Handle React routing (add this AFTER all API routes)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
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
async function startServer() {
  try {
    // Initialize cache directory
    await initializeCache();
    
    app.listen(PORT, () => {
      console.log(`🌤️  Weather API server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌡️  Weather endpoint: http://localhost:${PORT}/api/getweather?city=<cityname>`);
      console.log(`🗂️  Cache directory: ${CACHE_DIR}`);
      console.log(`⏰ Cache duration: 30 minutes`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

