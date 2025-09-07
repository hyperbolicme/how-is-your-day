// src/middleware/cors.js
const cors = require('cors');
const { config } = require('../config/environment');

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL  || 'http://localhost:5001',
    'http://how-is-your-day-frontend-hyperbolicme.s3-website.ap-south-1.amazonaws.com',
    'https://d2qr9yt8ob8ckr.cloudfront.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);