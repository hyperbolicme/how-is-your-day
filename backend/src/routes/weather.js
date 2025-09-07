// src/routes/weather.js
const express = require('express');
const weatherController = require('../controllers/weatherController');
const { validateWeather, validateForecast } = require('../middleware/validation');

const router = express.Router();

// Weather routes
router.get('/getweather', validateWeather, weatherController.getCurrentWeather);
router.get('/getforecast', validateForecast, weatherController.getForecast);

module.exports = router;