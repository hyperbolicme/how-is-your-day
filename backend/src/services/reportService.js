// src/services/reportService.js
const logger = require('../utils/logger');
const weatherService = require('./weatherService');
const newsService = require('./newsService');
const s3Service = require('./s3Service');
const { config } = require('../config/environment');
const { ERROR_MESSAGES } = require('../utils/constants');

class ReportService {

  // Enhanced report generation with database metadata storage
  async generateReportWithDB(city, country) {
    try {
      logger.info(`📊 Generating enhanced report for ${city}, ${country}...`);

      // 1. Generate the report (existing logic)
      const reportResult = await this.generateReport(city, country);
      
      if (!reportResult.success) {
        throw new Error('Report generation failed');
      }

      // 2. Store metadata in database
      try {
        const { dbService } = require('../config/database');
        
        // Extract metadata from the generated report
        const reportData = reportResult.report;
        const fileName = reportData.filename;
        const reportDate = reportData.date;
        const s3Key = reportResult.report.storage?.s3_key || `reports/default_user/${fileName}`;
        const fileSize = reportData.size_bytes || 0;
        
        // Get weather details from the preview
        const temperature = reportResult.preview?.current_temp ? 
          parseFloat(reportResult.preview.current_temp.replace('°C', '')) : null;
        const weatherCondition = reportResult.preview?.weather_desc || null;

        // Insert into weather_reports table
        const insertQuery = `
          INSERT INTO weather_reports 
          (city, report_date, s3_key, file_size, temperature, weather_condition) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await dbService.executeQuery(insertQuery, [
          city,
          reportDate,
          s3Key,
          fileSize,
          temperature,
          weatherCondition
        ]);
        
        logger.info(`✅ Report metadata stored in database for ${city}`);
        
        // Update city search count
        await this.updateCitySearchCount(city);
        
      } catch (dbError) {
        logger.error('⚠️ Failed to store report metadata in database:', dbError.message);
        // Don't fail the entire operation if DB storage fails
        reportResult.db_warning = 'Report saved but metadata storage failed';
      }

      return {
        ...reportResult,
        database_stored: true,
        message: reportResult.message + ' (with database metadata)'
      };

    } catch (error) {
      logger.error('❌ Enhanced report generation failed:', error);
      throw error;
    }
  }

  // Update city search count
  async updateCitySearchCount(city) {
    try {
      const { dbService } = require('../config/database');
      
      const upsertQuery = `
        INSERT INTO city_searches (city, search_count, last_searched) 
        VALUES (?, 1, NOW()) 
        ON DUPLICATE KEY UPDATE 
          search_count = search_count + 1,
          last_searched = NOW()
      `;
      
      await dbService.executeQuery(upsertQuery, [city]);
      logger.info(`📊 Updated search count for ${city}`);
      
    } catch (error) {
      logger.error('⚠️ Failed to update city search count:', error.message);
      // Don't throw - this is non-critical
    }
  }

  // Get report statistics from database
  async getReportStats() {
    try {
      const { dbService } = require('../config/database');
      
      // Get overall stats
      const totalReportsQuery = 'SELECT COUNT(*) as total_reports FROM weather_reports';
      const uniqueCitiesQuery = 'SELECT COUNT(DISTINCT city) as unique_cities FROM weather_reports';
      const recentReportsQuery = `
        SELECT COUNT(*) as recent_reports 
        FROM weather_reports 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAYS)
      `;
      
      // Get city breakdown
      const citiesBreakdownQuery = `
        SELECT city, COUNT(*) as report_count, MAX(created_at) as last_report
        FROM weather_reports 
        GROUP BY city 
        ORDER BY report_count DESC 
        LIMIT 10
      `;
      
      // Get popular cities from searches
      const popularCitiesQuery = `
        SELECT city, search_count, last_searched
        FROM city_searches 
        ORDER BY search_count DESC 
        LIMIT 10
      `;
      
      const [totalReports, uniqueCities, recentReports, citiesBreakdown, popularCities] = await Promise.all([
        dbService.executeQuery(totalReportsQuery),
        dbService.executeQuery(uniqueCitiesQuery),
        dbService.executeQuery(recentReportsQuery),
        dbService.executeQuery(citiesBreakdownQuery),
        dbService.executeQuery(popularCitiesQuery)
      ]);
      
      return {
        success: true,
        stats: {
          total_reports: totalReports[0].total_reports,
          unique_cities: uniqueCities[0].unique_cities,
          recent_reports: recentReports[0].recent_reports,
          cities_breakdown: citiesBreakdown,
          popular_cities: popularCities
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('❌ Failed to get report stats:', error);
      throw error;
    }
  }

  // Get reports by city from database
  async getReportsByCity(city, limit = 10) {
    try {
      const { dbService } = require('../config/database');
      
      const query = `
        SELECT id, city, report_date, s3_key, file_size, temperature, weather_condition, created_at
        FROM weather_reports 
        WHERE city = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const reports = await dbService.executeQuery(query, [city, limit]);
      
      return {
        success: true,
        city: city,
        reports: reports,
        total_found: reports.length
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get reports for ${city}:`, error);
      throw error;
    }
  }

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