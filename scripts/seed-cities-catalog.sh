#!/bin/bash

# Script to seed the French cities catalog into Firestore
# Usage: ./scripts/seed-cities-catalog.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get DEV_SEED_TOKEN from .env.local or use default
if [ -f .env.local ]; then
  export DEV_SEED_TOKEN=$(grep DEV_SEED_TOKEN .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi

# Default token if not found
DEV_SEED_TOKEN=${DEV_SEED_TOKEN:-DEV_SEED_TOKEN}

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Seeding French cities catalog into Firestore...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo -e "${RED}Error: Next.js server is not running on http://localhost:3000${NC}"
  echo "Please start the server with: npm run dev"
  exit 1
fi

# Warning about time
echo -e "${YELLOW}⚠️  This will fetch ALL French cities (~35,000 communes)${NC}"
echo -e "${YELLOW}   This may take 5-10 minutes depending on API response time${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}Calling POST /api/dev/cities-catalog...${NC}"
echo ""

# Execute the seed
RESPONSE=$(curl -s -X POST http://localhost:3000/api/dev/cities-catalog \
  -H "Authorization: Bearer $DEV_SEED_TOKEN" \
  -H "Content-Type: application/json" \
  --max-time 600)

# Check if response contains "ok"
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✓ Seed completed successfully!${NC}"
  echo ""
  echo -e "${BLUE}Summary:${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo -e "${GREEN}Cities catalog is now populated in Firestore!${NC}"
  echo ""
  echo "Collection: cities_catalog"
  echo "Document ID format: {city_name}_{department_code}"
  echo ""
  echo "Example IDs:"
  echo "  - paris_75"
  echo "  - lyon_69"
  echo "  - marseille_13"
else
  echo -e "${RED}✗ Seed failed!${NC}"
  echo ""
  echo "Response:"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

