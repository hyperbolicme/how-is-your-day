# Steps to deploy frontend and backend

cd how-is-your-day/
git pull origin main
pm2 stop weather-api
cd frontend
npm run build

aws s3 sync dist/ s3://how-is-your-day-frontend-hyperbolicme/ --delete

cd ..
cd backend
pm2 start server.js --name weather-api
pm2 logs weather-api