#!/bin/bash

###############################################################################
# Sister's Promise - Full Stack Launch Script
# 
# This script launches all services for the Sister's Promise mobile app:
# - Backend Express.js server
# - React Native Metro bundler
# - iOS simulator
#
# Usage: ./launch-all.sh [--backend-only|--metro-only|--ios-only|--debug]
# 
# Options:
#   --backend-only   : Start only the backend server
#   --metro-only     : Start only the Metro bundler
#   --ios-only       : Start only the iOS simulator
#   --debug          : Enable verbose logging
#   --help           : Show this message
#
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
MOBILE_DIR="$SCRIPT_DIR/SistersPromiseMobile"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEBUG=false

# Create logs directory
mkdir -p "$LOG_DIR"

# Parse arguments
START_BACKEND=true
START_METRO=true
START_IOS=true

for arg in "$@"; do
  case $arg in
    --backend-only)
      START_METRO=false
      START_IOS=false
      ;;
    --metro-only)
      START_BACKEND=false
      START_IOS=false
      ;;
    --ios-only)
      START_BACKEND=false
      START_METRO=false
      ;;
    --debug)
      DEBUG=true
      ;;
    --help)
      grep "^#" "$0" | grep -v "^#!/bin/bash"
      exit 0
      ;;
  esac
done

###############################################################################
# Helper Functions
###############################################################################

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

debug_log() {
  if [ "$DEBUG" = true ]; then
    echo -e "${BLUE}[DEBUG]${NC} $1"
  fi
}

wait_for_port() {
  local port=$1
  local timeout=$2
  local elapsed=0
  
  log_info "Waiting for port $port to be ready (timeout: ${timeout}s)..."
  
  while [ $elapsed -lt $timeout ]; do
    if nc -z localhost "$port" 2>/dev/null; then
      log_success "Port $port is ready!"
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  
  log_warning "Port $port did not become ready within ${timeout}s"
  return 1
}

check_requirements() {
  log_info "Checking system requirements..."
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js first."
    exit 1
  fi
  debug_log "Node.js version: $(node --version)"
  
  # Check npm
  if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm first."
    exit 1
  fi
  debug_log "npm version: $(npm --version)"
  
  # Check for backend dependencies
  if [ "$START_BACKEND" = true ]; then
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
      log_warning "Backend node_modules not found. Installing dependencies..."
      cd "$BACKEND_DIR"
      npm install
      cd "$SCRIPT_DIR"
    fi
  fi
  
  # Check for mobile dependencies
  if [ "$START_METRO" = true ] || [ "$START_IOS" = true ]; then
    if [ ! -d "$MOBILE_DIR/node_modules" ]; then
      log_warning "Mobile node_modules not found. Installing dependencies..."
      cd "$MOBILE_DIR"
      npm install
      cd "$SCRIPT_DIR"
    fi
  fi
  
  # Check for watchman (required for Metro on macOS)
  if [ "$START_METRO" = true ]; then
    if ! command -v watchman &> /dev/null; then
      log_warning "Watchman not found. Installing via Homebrew..."
      brew install watchman
    fi
    debug_log "Watchman version: $(watchman --version)"
  fi
  
  # Check for Xcode (required for iOS)
  if [ "$START_IOS" = true ]; then
    if ! command -v xcode-select &> /dev/null; then
      log_error "Xcode Command Line Tools not found. Please install Xcode."
      exit 1
    fi
    debug_log "Xcode available: $(xcode-select --print-path)"
  fi
  
  log_success "All requirements satisfied!"
}

start_backend() {
  log_info "Starting Backend Server..."
  
  cd "$BACKEND_DIR"
  
  # Kill any existing processes on ports 443 and 3000
  if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warning "Port 443 already in use. Attempting to free it..."
    lsof -ti:443 | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  
  if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_warning "Port 3000 already in use. Attempting to free it..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  
  # Start backend server in background with logs
  npm start > "$LOG_DIR/backend_$TIMESTAMP.log" 2>&1 &
  BACKEND_PID=$!
  debug_log "Backend started with PID: $BACKEND_PID"
  
  # Save PID for cleanup
  echo $BACKEND_PID > "$LOG_DIR/backend.pid"
  
  # Wait for both ports to be ready
  if wait_for_port 443 30; then
    log_success "Backend server is running on https://localhost:443"
  else
    log_error "Backend server failed to start on port 443. Check logs:"
    tail -20 "$LOG_DIR/backend_$TIMESTAMP.log"
    exit 1
  fi
  
  # Verify HTTP port for simulator is ready
  if wait_for_port 3000 10; then
    log_success "HTTP redirect server is running on http://localhost:3000 (for simulator)"
  else
    log_warning "HTTP server on port 3000 not responding yet, continuing anyway..."
  fi
}

start_metro() {
  log_info "Starting Metro Bundler..."
  
  cd "$MOBILE_DIR"
  
  # Kill any existing Metro process
  if pgrep -f "react-native.*start" > /dev/null; then
    log_warning "Existing Metro process found. Killing..."
    pkill -f "react-native.*start" || true
    sleep 2
  fi
  
  # Also kill any watchman processes that might interfere
  if pgrep -f "watchman" > /dev/null; then
    log_warning "Restarting Watchman..."
    pkill -f "watchman" || true
    sleep 1
  fi
  
  # Start Metro with cache reset
  npm start -- --reset-cache > "$LOG_DIR/metro_$TIMESTAMP.log" 2>&1 &
  METRO_PID=$!
  debug_log "Metro started with PID: $METRO_PID"
  
  # Save PID for cleanup
  echo $METRO_PID > "$LOG_DIR/metro.pid"
  
  # Wait for Metro to be ready on port 8081
  if wait_for_port 8081 60; then
    log_success "Metro bundler is running on http://localhost:8081"
  else
    log_error "Metro bundler failed to start. Check logs:"
    tail -30 "$LOG_DIR/metro_$TIMESTAMP.log"
    exit 1
  fi
  
  log_info "Metro logs: tail -f $LOG_DIR/metro_$TIMESTAMP.log"
}

start_ios() {
  log_info "Starting iOS Simulator..."
  
  cd "$MOBILE_DIR"
  
  # Check if simulator is already running
  if ! xcrun simctl list devices | grep -i "booted" > /dev/null; then
    log_info "No booted simulator found. Starting default iPhone simulator..."
    xcrun simctl boot "iPhone 15" 2>/dev/null || true
    sleep 5
  fi
  
  # Verify Metro is ready before building
  log_info "Verifying Metro bundler is ready..."
  if ! nc -z localhost 8081 2>/dev/null; then
    log_error "Metro bundler not responding on port 8081. Please wait for Metro startup to complete."
    log_info "View Metro logs: tail -f $LOG_DIR/metro_$TIMESTAMP.log"
    exit 1
  fi
  
  # Build and run iOS app
  npm run ios > "$LOG_DIR/ios_$TIMESTAMP.log" 2>&1 &
  IOS_PID=$!
  debug_log "iOS build started with PID: $IOS_PID"
  
  # Wait for build to complete (longer for initial build)
  sleep 30
  
  log_success "iOS app is launching in simulator"
  log_info "iOS logs: tail -f $LOG_DIR/ios_$TIMESTAMP.log"
}

display_status() {
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║${NC}        Sister's Promise - Full Stack Running${NC}              ${GREEN}║${NC}"
  echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
  
  if [ "$START_BACKEND" = true ]; then
    echo -e "${GREEN}║${NC} ✓ Backend Server                                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   URL: https://localhost:443                             ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Log: tail -f $LOG_DIR/backend_$TIMESTAMP.log ${GREEN}║${NC}"
  fi
  
  if [ "$START_METRO" = true ]; then
    echo -e "${GREEN}║${NC} ✓ Metro Bundler                                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Status: Running                                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Log: tail -f $LOG_DIR/metro_$TIMESTAMP.log ${GREEN}║${NC}"
  fi
  
  if [ "$START_IOS" = true ]; then
    echo -e "${GREEN}║${NC} ✓ iOS Simulator                                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Status: Running                                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}   Log: tail -f $LOG_DIR/ios_$TIMESTAMP.log ${GREEN}║${NC}"
  fi
  
  echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║${NC} Login Credentials:                                       ${GREEN}║${NC}"
  echo -e "${GREEN}║${NC}   Email: d@sp.com                                        ${GREEN}║${NC}"
  echo -e "${GREEN}║${NC}   Password: pass123                                      ${GREEN}║${NC}"
  echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║${NC} Stop Services:                                          ${GREEN}║${NC}"
  echo -e "${GREEN}║${NC}   Press Ctrl+C to stop all services                      ${GREEN}║${NC}"
  echo -e "${GREEN}║${NC}   Or run: ./kill-all.sh                                  ${GREEN}║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

cleanup() {
  echo ""
  log_info "Shutting down services..."
  
  if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
      kill $BACKEND_PID 2>/dev/null || true
      log_success "Stopped backend server"
    fi
    rm -f "$LOG_DIR/backend.pid"
  fi
  
  if [ -f "$LOG_DIR/metro.pid" ]; then
    METRO_PID=$(cat "$LOG_DIR/metro.pid")
    if ps -p $METRO_PID > /dev/null 2>&1; then
      kill $METRO_PID 2>/dev/null || true
      log_success "Stopped Metro bundler"
    fi
    rm -f "$LOG_DIR/metro.pid"
  fi
  
  log_success "All services stopped"
  exit 0
}

###############################################################################
# Main Execution
###############################################################################

echo ""
log_info "=========================================="
log_info "Sister's Promise - Full Stack Launcher"
log_info "=========================================="
echo ""

# Set up trap for cleanup on exit
trap cleanup SIGINT SIGTERM

# Check requirements
check_requirements

# Start services
if [ "$START_BACKEND" = true ]; then
  start_backend
  sleep 2
fi

if [ "$START_METRO" = true ]; then
  start_metro
  sleep 2
fi

if [ "$START_IOS" = true ]; then
  start_ios
fi

# Display status
display_status

# Keep script running
log_info "Services are running. Press Ctrl+C to stop."
while true; do
  sleep 1
done
