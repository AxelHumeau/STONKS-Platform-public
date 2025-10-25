#!/bin/bash

# Ngrok deployment script for backend
set -e

echo "🚀 Setting up Ngrok for Backend"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${RED}❌ ngrok is not installed${NC}"
    echo ""
    echo "Install ngrok:"
    echo "  1. Download from: https://ngrok.com/download"
    echo "  2. Or use snap: sudo snap install ngrok"
    echo "  3. Or use homebrew: brew install ngrok/ngrok/ngrok"
    echo ""
    echo "After installation, authenticate:"
    echo "  ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

# Start ngrok
echo -e "${YELLOW}🌐 Starting ngrok tunnel...${NC}"
ngrok http 3001 --log=stdout > /tmp/ngrok.log &

# Wait for ngrok to start
sleep 3

echo "refvgbreg"
# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URL${NC}"
    echo "Check ngrok logs:"
    echo "  tail -f /tmp/ngrok.log"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Ngrok tunnel is active!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📡 Backend Public URL:${NC}"
echo -e "   ${YELLOW}${NGROK_URL}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test endpoints:"
echo "  Health: ${NGROK_URL}/health"
echo "  Events: ${NGROK_URL}/api/events"
echo "  Oracle: ${NGROK_URL}/api/oracle/prices"
echo ""
echo "Update frontend .env.local:"
echo "  NEXT_PUBLIC_BACKEND_URL=${NGROK_URL}"
echo ""
echo "Ngrok dashboard:"
echo "  http://localhost:4040"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop ngrok${NC}"
echo ""

# Keep script running and tail logs
tail -f /tmp/ngrok.log
