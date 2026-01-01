#!/usr/bin/env bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
  echo -e "${BLUE}[TUNNEL]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[TUNNEL]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[TUNNEL]${NC} $1"
}

print_error() {
  echo -e "${RED}[TUNNEL]${NC} $1"
}

# Check if cloudflared is available
if ! command -v cloudflared &>/dev/null; then
  print_error "cloudflared not found. Please install it first."
  exit 1
fi

# Check if CLOUDFLARE_TOKEN is set
if [ -z "$CLOUDFLARE_TOKEN" ]; then
  print_error "CLOUDFLARE_TOKEN environment variable is not set"
  exit 1
fi

# Set default tunnel domain if not provided
if [ -z "$TUNNEL_DOMAIN" ]; then
  TUNNEL_DOMAIN="delivery-tracker.example.com"
  print_warning "TUNNEL_DOMAIN not set, using default: $TUNNEL_DOMAIN"
fi

print_status "Setting up Cloudflare Tunnel..."

# Create tunnel configuration directory
mkdir -p ~/.cloudflared

# Create tunnel configuration
TUNNEL_CONFIG=~/.cloudflared/config.yml

print_status "Creating tunnel configuration..."
cat >"$TUNNEL_CONFIG" <<EOF
tunnel: delivery-tracker
credentials-file: ~/.cloudflared/delivery-tracker.json

ingress:
  - hostname: ${TUNNEL_DOMAIN}
    service: http://localhost:4200
  - hostname: api.${TUNNEL_DOMAIN}
    service: http://localhost:8080
  - service: http_status:404
EOF

# Authenticate with Cloudflare
print_status "Authenticating with Cloudflare..."
export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_TOKEN"

# Create tunnel if it doesn't exist
TUNNEL_ID=$(cloudflared tunnel list | grep "delivery-tracker" | awk '{print $1}' || true)

if [ -z "$TUNNEL_ID" ]; then
  print_status "Creating new tunnel..."
  cloudflared tunnel create delivery-tracker
  TUNNEL_ID=$(cloudflared tunnel list | grep "delivery-tracker" | awk '{print $1}')
  print_success "Tunnel created with ID: $TUNNEL_ID"
else
  print_success "Using existing tunnel with ID: $TUNNEL_ID"
fi

# Get tunnel credentials
CRED_FILE=~/.cloudflared/delivery-tracker.json
if [ ! -f "$CRED_FILE" ]; then
  print_status "Downloading tunnel credentials..."
  cloudflared tunnel token delivery-tracker >/tmp/tunnel-token.txt 2>/dev/null || true
fi

# Create DNS records
print_status "Creating DNS records..."
cloudflared tunnel route dns delivery-tracker "$TUNNEL_DOMAIN" || print_warning "DNS record may already exist"
cloudflared tunnel route dns delivery-tracker "api.$TUNNEL_DOMAIN" || print_warning "API DNS record may already exist"

# Function to cleanup tunnel on exit
cleanup_tunnel() {
  print_status "Stopping tunnel..."
  pkill -f "cloudflared tunnel run" 2>/dev/null || true
}

trap cleanup_tunnel EXIT

# Start the tunnel
print_status "Starting Cloudflare tunnel..."
print_success "🌐 Tunnel URLs:"
print_success "   Frontend: https://$TUNNEL_DOMAIN"
print_success "   API: https://api.$TUNNEL_DOMAIN"

cloudflared tunnel --config "$TUNNEL_CONFIG" run delivery-tracker
