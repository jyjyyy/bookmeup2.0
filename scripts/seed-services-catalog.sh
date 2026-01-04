#!/bin/bash

# Script to seed the beauty services catalog into Firestore
# Usage: ./scripts/seed-services-catalog.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get DEV_SEED_TOKEN from .env.local or use default
if [ -f .env.local ]; then
  export DEV_SEED_TOKEN=$(grep DEV_SEED_TOKEN .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi

# Default token if not found
DEV_SEED_TOKEN=${DEV_SEED_TOKEN:-DEV_SEED_TOKEN}

echo -e "${YELLOW}Seeding services catalog into Firestore...${NC}"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo -e "${RED}Error: Next.js server is not running on http://localhost:3000${NC}"
  echo "Please start the server with: npm run dev"
  exit 1
fi

# Execute the seed
echo "Calling POST /api/dev/services-catalog..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/dev/services-catalog \
  -H "Authorization: Bearer $DEV_SEED_TOKEN" \
  -H "Content-Type: application/json")

# Check if response contains "ok"
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✓ Seed completed successfully!${NC}"
  echo ""
  echo "Response:"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo -e "${GREEN}Services catalog is now populated in Firestore!${NC}"
  echo ""
  echo "You can now test the autocomplete:"
  echo "  GET http://localhost:3000/api/services/autocomplete?q=m"
else
  echo -e "${RED}✗ Seed failed!${NC}"
  echo ""
  echo "Response:"
  echo "$RESPONSE"
  exit 1
fi

