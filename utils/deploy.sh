#!/bin/bash
# deploy.sh - Enhanced deployment script with fresh deployment support

set -e  # Exit on any error

# Configuration
DEFAULT_APP_DIR="/home/ubuntu/how-is-your-day"
GIT_REPO="https://github.com/hyperbolicme/how-is-your-day.git"
S3_BUCKET="how-is-your-day-frontend-hyperbolicme"
PM2_APP_NAME="weather-news-api"

# Parse command line arguments
FRESH_DEPLOY=false
APP_DIR="$DEFAULT_APP_DIR"

while [[ $# -gt 0 ]]; do
  case $1 in
    --fresh)
      FRESH_DEPLOY=true
      shift
      ;;
    --dir)
      APP_DIR="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --fresh          Perform fresh deployment (git clone)"
      echo "  --dir PATH       Deployment directory (default: $DEFAULT_APP_DIR)"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "Starting deployment..."
echo "Fresh deploy: $FRESH_DEPLOY"
echo "App directory: $APP_DIR"

if [[ "$FRESH_DEPLOY" == true ]]; then
    echo "Performing fresh deployment..."
    
    # Remove existing directory if it exists
    if [[ -d "$APP_DIR" ]]; then
        echo "Removing existing directory: $APP_DIR"
        rm -rf "$APP_DIR"
    fi
    
    # Create parent directory
    mkdir -p "$(dirname "$APP_DIR")"
    
    # Clone repository
    echo "Cloning repository: $GIT_REPO"
    git clone "$GIT_REPO" "$APP_DIR"
    
    # Install dependencies
    echo "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    
    echo "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    
    # Setup frontend environment (automatic)
    echo "Setting up frontend environment..."
    cd "$FRONTEND_DIR"
    if [[ ! -f .env && -f .env.example ]]; then
        cp .env.example .env
        echo "Created frontend .env from template"
    fi

    # Setup backend environment (requires user input)
    echo "Setting up backend environment..."
    cd "$BACKEND_DIR"
    if [[ ! -f .env ]]; then
        if [[ -f .env.example ]]; then
            cp .env.example .env
            echo "Created backend .env from template"
            echo ""
            echo "IMPORTANT: Please edit $BACKEND_DIR/.env with your actual API keys"
            echo "Required keys: WEATHER_API_KEY, NEWS_API_KEY, NEWS_GUARDIAN_API_KEY"
            echo ""
            echo "You can edit with: nano $BACKEND_DIR/.env"
            echo "Press any key when you've updated the backend .env file..."
            read -n 1
        else
            echo "ERROR: backend .env.example not found in repository"
            exit 1
        fi
    fi
    
else
    # Regular deployment
    echo "Updating existing deployment..."
    
    # Backup current version
    echo "Creating backup..."
    cp -r "$BACKEND_DIR" "$BACKEND_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Pull latest code
    echo "Pulling latest code..."
    cd "$APP_DIR"
    git pull origin main
    
    # Install dependencies if package.json changed
    if git diff HEAD~1 --name-only | grep -q "package.json"; then
        echo "Package.json changed, installing dependencies..."
        cd "$BACKEND_DIR" && npm install
        cd "$FRONTEND_DIR" && npm install
    fi
fi




# Common deployment steps
echo "Building frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "Deploying frontend to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

echo "Managing backend service..."
cd "$BACKEND_DIR"

# Load environment variables
if [[ -f .env ]]; then
    # load environment vars (filters comments and empty lines)
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Stop PM2 gracefully
pm2 stop $PM2_APP_NAME 2>/dev/null || echo "App not running"

# Start with correct path
pm2 start src/server.js --name $PM2_APP_NAME

# Verify deployment
echo "Verifying deployment..."
sleep 5

if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✓ Backend health check passed"
    pm2 save
else
    echo "✗ Backend health check failed"
    exit 1
fi

echo "Deployment completed successfully!"