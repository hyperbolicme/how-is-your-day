# Deployment on EC2


cd how-is-your-day/
git pull origin main
pm2 stop weather-api
cd frontend
npm run build
cd ..
cd backend
pm2 start server.js --name weather-api
pm2 logs weather-api