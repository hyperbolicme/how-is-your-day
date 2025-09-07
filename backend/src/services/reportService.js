// src/services/reportService.js
const logger = require('../utils/logger');
const weatherService = require('./weatherService');
const newsService = require('./newsService');
const s3Service = require('./s3Service');
const { config } = require('../config/environment');
const { ERROR_MESSAGES } = require('../utils/constants');

class ReportService {
  // Generate comprehensive daily report
  async generateReport(city = 'Kochi', country = 'IN') {
    try {
      logger.info('🚀 Generating comprehensive daily report...');
      
      // Check if required environment variables exist
      if (!config.weatherApiKey || !config.newsApiKey) {
        throw new Error(ERROR_MESSAGES.MISSING_API_KEYS);
      }
      
      logger.info(`📊 Fetching data for ${city}...`);
      
      // 1. Fetch weather data
      let currentWeather, forecastData;
      
      try {
        logger.info('🌤️ Fetching current weather...');
        currentWeather = await weatherService.getCurrentWeather(city);
        logger.info('✅ Current weather fetched');
        
        logger.info('🌤️ Fetching forecast...');
        forecastData = await weatherService.getForecast(city);
        logger.info('✅ Forecast data fetched');
        
      } catch (weatherError) {
        logger.error('❌ Weather API error:', weatherError.message);
        throw new Error(`Failed to fetch weather data: ${weatherError.message}`);
      }
      
      // 2. Fetch news data
      let newsData;
      
      try {
        logger.info('📰 Fetching news...');
        newsData = await newsService.getNews(country, 'general', 5);
        logger.info('✅ News data fetched');
        
      } catch (newsError) {
        logger.error('❌ News API error:', newsError.message);
        throw new Error(`Failed to fetch news data: ${newsError.message}`);
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
          environment: config.nodeEnv
        },
        weather: {
          current: {
            temperature: currentWeather.data.temperature,
            feels_like: currentWeather.data.feelsLike,
            humidity: currentWeather.data.humidity,
            pressure: currentWeather.data.raw?.main?.pressure || 'N/A',
            description: currentWeather.data.description,
            wind_speed: currentWeather.data.windSpeed
          },
          forecast: forecastData.data.forecasts.slice(0, 8).map(item => ({
            datetime: item.date,
            temperature: item.temperature,
            description: item.description,
            humidity: item.humidity
          }))
        },
        news: {
          headlines: newsData.data.articles.slice(0, 5).map(article => ({
            title: article.title,
            description: article.description,
            source: article.source,
            published_at: article.publishedAt,
            url: article.url
          })),
          total_articles: newsData.data.totalResults
        },
        summary: {
          weather_summary: `Current temperature in ${city} is ${currentWeather.data.temperature}°C with ${currentWeather.data.description}`,
          top_news: newsData.data.articles[0]?.title || 'No news available'
        }
      };
      
      const fileName = `${city.toLowerCase()}-${dateStr}-${timestampStr}.json`;
      
      // 4. Save report (S3 if available, local otherwise)
      const hasAWS = await s3Service.hasAWSAccess();
      let saveResult;
      
      if (hasAWS) {
        try {
          saveResult = await s3Service.saveReport(report, fileName);
        } catch (s3Error) {
          logger.error('❌ S3 save failed, falling back to local save:', s3Error.message);
          saveResult = await s3Service.saveReportLocally(report, fileName);
          saveResult.s3_error = s3Error.message;
        }
      } else {
        saveResult = await s3Service.saveReportLocally(report, fileName);
      }
      
      // 5. Return success response
      return {
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
      };
      
    } catch (error) {
      logger.error('❌ Error generating report:', error);
      throw error;
    }
  }

  // List all reports
  async listReports() {
    try {
      logger.info('📋 Fetching list of all reports...');
      
      const hasAWS = await s3Service.hasAWSAccess();
      
      if (hasAWS) {
        try {
          const s3Reports = await s3Service.listReports();
          return {
            success: true,
            message: `Found ${s3Reports.total_count} reports`,
            data: s3Reports
          };
        } catch (s3Error) {
          logger.error('❌ S3 list failed:', s3Error.message);
          
          // Fallback to local storage
          const localReports = await s3Service.listLocalReports();
          return {
            success: true,
            message: 'S3 unavailable, showing local reports',
            data: {
              reports: localReports,
              total_count: localReports.length,
              storage_location: 'Local (S3 failed)',
              s3_error: s3Error.message
            }
          };
        }
      } else {
        const localReports = await s3Service.listLocalReports();
        return {
          success: true,
          message: `Found ${localReports.length} local reports`,
          data: {
            reports: localReports,
            total_count: localReports.length,
            storage_location: 'Local'
          }
        };
      }
      
    } catch (error) {
      logger.error('❌ Error listing reports:', error);
      throw error;
    }
  }

  // Get specific report
  async getReport(filename) {
    try {
      logger.info(`📄 Fetching report details for: ${filename}`);
      
      const hasAWS = await s3Service.hasAWSAccess();
      
      if (hasAWS) {
        try {
          return await s3Service.getReport(filename);
        } catch (s3Error) {
          logger.debug('❌ S3 fetch failed, trying local storage:', s3Error.message);
          
          if (s3Error.name === 'NoSuchKey') {
            // File doesn't exist in S3, try local
            return await s3Service.getLocalReport(filename);
          } else {
            // Other S3 error, still try local
            return await s3Service.getLocalReport(filename);
          }
        }
      } else {
        return await s3Service.getLocalReport(filename);
      }
      
    } catch (error) {
      logger.error('❌ Error fetching report:', error);
      
      if (error.code === 'ENOENT') {
        const reportError = new Error(`Report '${filename}' not found in S3 or local storage`);
        reportError.status = 404;
        reportError.details = {
          s3_checked: await s3Service.hasAWSAccess(),
          local_checked: true
        };
        throw reportError;
      }
      
      throw error;
    }
  }
}

module.exports = new ReportService();