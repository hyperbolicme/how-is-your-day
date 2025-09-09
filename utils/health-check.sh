#!/bin/bash
# health-check.sh - Comprehensive application health monitoring script

set -e

# Configuration
BACKEND_URL="http://localhost:5001"
S3_REPORTS_BUCKET="weather-app-reports-hyperbolicme"
S3_FRONTEND_BUCKET="how-is-your-day-frontend-hyperbolicme"
EC2_INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "unknown")
LOG_FILE="/tmp/health-check-$(date +%Y%m%d).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Health check functions
check_api_health() {
    log "🏥 Checking API health..."
    
    if curl -f -s "$BACKEND_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✓ API health check passed${NC}"
        
        # Get detailed server info
        SERVER_INFO=$(curl -s "$BACKEND_URL/api/server-info" | jq -r '.server | "Uptime: \(.uptime)s, Memory: \(.hostname)"' 2>/dev/null || echo "Could not parse server info")
        echo "  Server: $SERVER_INFO"
        return 0
    else
        echo -e "${RED}✗ API health check failed${NC}"
        return 1
    fi
}

check_pm2_status() {
    log "🔄 Checking PM2 status..."
    
    PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="weather-news-api") | .pm2_env.status' 2>/dev/null || echo "unknown")
    
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "${GREEN}✓ PM2 service is online${NC}"
        
        # Get PM2 details
        PM2_UPTIME=$(pm2 jlist | jq -r '.[] | select(.name=="weather-news-api") | .pm2_env.pm_uptime' 2>/dev/null)
        PM2_MEMORY=$(pm2 jlist | jq -r '.[] | select(.name=="weather-news-api") | .monit.memory' 2>/dev/null)
        
        if [ "$PM2_UPTIME" != "null" ] && [ "$PM2_MEMORY" != "null" ]; then
            UPTIME_HOURS=$((($PM2_UPTIME / 1000 / 3600)))
            MEMORY_MB=$((PM2_MEMORY / 1024 / 1024))
            echo "  Uptime: ${UPTIME_HOURS}h, Memory: ${MEMORY_MB}MB"
        fi
        return 0
    else
        echo -e "${RED}✗ PM2 service status: $PM2_STATUS${NC}"
        return 1
    fi
}

check_s3_connectivity() {
    log "☁️ Checking S3 connectivity..."
    
    # Check reports bucket
    if aws s3 ls "s3://$S3_REPORTS_BUCKET" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ S3 reports bucket accessible${NC}"
        REPORTS_COUNT=$(aws s3 ls "s3://$S3_REPORTS_BUCKET/reports/" --recursive | wc -l)
        echo "  Reports stored: $REPORTS_COUNT"
    else
        echo -e "${RED}✗ S3 reports bucket not accessible${NC}"
    fi
    
    # Check frontend bucket
    if aws s3 ls "s3://$S3_FRONTEND_BUCKET" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ S3 frontend bucket accessible${NC}"
        FRONTEND_SIZE=$(aws s3 ls "s3://$S3_FRONTEND_BUCKET" --recursive --summarize | grep "Total Size" | awk '{print $3, $4}')
        echo "  Frontend size: $FRONTEND_SIZE"
    else
        echo -e "${RED}✗ S3 frontend bucket not accessible${NC}"
    fi
}

check_ec2_resources() {
    log "🖥️ Checking EC2 resources..."
    
    # Memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        echo -e "${YELLOW}⚠ Memory usage: ${MEMORY_USAGE}%${NC}"
    else
        echo -e "${GREEN}✓ Memory usage: ${MEMORY_USAGE}%${NC}"
    fi
    
    # Disk usage
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        echo -e "${YELLOW}⚠ Disk usage: ${DISK_USAGE}%${NC}"
    else
        echo -e "${GREEN}✓ Disk usage: ${DISK_USAGE}%${NC}"
    fi
    
    # CPU load
    CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    echo -e "${BLUE}ℹ CPU load: ${CPU_LOAD}${NC}"
}

check_external_access() {
    log "🌐 Checking external accessibility..."
    
    # Get public IP - try EC2 metadata first, then fallback to external service
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)
    
    # If empty or failed, use external service
    if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "" ]; then
        PUBLIC_IP=$(curl -s https://api.ipify.org 2>/dev/null)
    fi
    
    if [ -n "$PUBLIC_IP" ]; then
        echo "Public IP: $PUBLIC_IP"
        
        # Test external access
        if curl -f -s "http://$PUBLIC_IP:5001/api/health" > /dev/null; then
            echo -e "${GREEN}✓ Application accessible externally${NC}"
        else
            echo -e "${RED}✗ Application not accessible externally${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Could not determine public IP${NC}"
    fi
}

generate_report() {
    log "📊 Generating health report..."
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    REPORT_FILE="/tmp/health-report-$(date +%Y%m%d-%H%M%S).json"
    
    # Collect all data
    API_STATUS=$(curl -f -s "$BACKEND_URL/api/health" > /dev/null && echo "healthy" || echo "unhealthy")
    PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="weather-news-api") | .pm2_env.status' 2>/dev/null || echo "unknown")
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    
    # Create JSON report
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "instance_id": "$EC2_INSTANCE_ID",
  "health_check": {
    "api_status": "$API_STATUS",
    "pm2_status": "$PM2_STATUS",
    "memory_usage_percent": $MEMORY_USAGE,
    "disk_usage_percent": $DISK_USAGE
  },
  "s3_buckets": {
    "reports_accessible": $(aws s3 ls "s3://$S3_REPORTS_BUCKET" > /dev/null 2>&1 && echo "true" || echo "false"),
    "frontend_accessible": $(aws s3 ls "s3://$S3_FRONTEND_BUCKET" > /dev/null 2>&1 && echo "true" || echo "false")
  }
}
EOF
    
    echo "Report saved to: $REPORT_FILE"
    
    # Optionally upload to S3
    if [ "$1" = "--upload" ]; then
        aws s3 cp "$REPORT_FILE" "s3://$S3_REPORTS_BUCKET/health-reports/$(basename $REPORT_FILE)"
        echo "Report uploaded to S3"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting comprehensive health check...${NC}"
    echo "Instance: $EC2_INSTANCE_ID"
    echo "Time: $(date)"
    echo "----------------------------------------"
    
    FAILED_CHECKS=0
    
    check_api_health || ((FAILED_CHECKS++))
    echo ""
    
    check_pm2_status || ((FAILED_CHECKS++))
    echo ""
    
    check_s3_connectivity || ((FAILED_CHECKS++))
    echo ""
    
    check_ec2_resources
    echo ""
    
    check_external_access
    echo ""
    
    # Generate report if requested
    if [ "$1" = "--report" ] || [ "$2" = "--report" ]; then
        generate_report "$1"
        echo ""
    fi
    
    echo "----------------------------------------"
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}🎉 All health checks passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ $FAILED_CHECKS health check(s) failed${NC}"
        exit 1
    fi
}

# Show help
if [ "$1" = "--help" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --report         Generate JSON health report"
    echo "  --upload         Upload report to S3 (use with --report)"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run basic health check"
    echo "  $0 --report           # Run health check and generate report"
    echo "  $0 --report --upload  # Run health check, generate and upload report"
    exit 0
fi

# Run main function
main "$@"