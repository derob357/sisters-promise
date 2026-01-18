#!/bin/bash

###############################################################################
# Sisters Promise - Kill All Services Script
# 
# This script safely stops all running services:
# - Backend Express.js server
# - React Native Metro bundler
# - iOS simulator processes
#
###############################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
log_info "Stopping Sisters Promise services..."
echo ""

# Kill Metro bundler
if pgrep -f "react-native.*start" > /dev/null; then
  log_info "Stopping Metro bundler..."
  pkill -f "react-native.*start" || true
  sleep 1
  log_success "Metro bundler stopped"
fi

# Kill Node.js backend
if pgrep -f "node.*server.js" > /dev/null; then
  log_info "Stopping backend server..."
  pkill -f "node.*server.js" || true
  sleep 1
  log_success "Backend server stopped"
fi

# Kill any remaining Node processes (be careful with this)
remaining_node=$(pgrep -f "node" | grep -v "watchman" | wc -l)
if [ $remaining_node -gt 0 ]; then
  log_warning "Found $remaining_node remaining Node process(es)"
  log_info "Attempting to stop remaining Node processes..."
  pgrep -f "node" | grep -v "watchman" | xargs kill -9 2>/dev/null || true
  log_success "Remaining Node processes killed"
fi

# Free up ports 443 and 3000
if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null 2>&1; then
  log_warning "Process still running on port 443. Forcing shutdown..."
  lsof -ti:443 | xargs kill -9 2>/dev/null || true
  sleep 1
  log_success "Port 443 freed"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  log_warning "Process still running on port 3000. Forcing shutdown..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
  log_success "Port 3000 freed"
fi

# Clean up logs directory if requested
if [ "$1" = "--clean-logs" ]; then
  log_info "Cleaning up logs directory..."
  rm -f /Users/drob/Documents/SistersPromise/logs/*.log
  log_success "Logs cleaned"
fi

echo ""
log_success "All services stopped successfully"
echo ""
