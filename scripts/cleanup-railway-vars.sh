#!/bin/bash

# Railway Variable Cleanup Script
# Removes legacy variables and updates to match current .env.local

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Railway Variable Cleanup ===${NC}\n"

# Check railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Error: Railway CLI not installed${NC}"
    exit 1
fi

# Get Railway domain
RAILWAY_DOMAIN=$(railway variables --kv 2>/dev/null | grep "^RAILWAY_PUBLIC_DOMAIN=" | cut -d'=' -f2)
if [ -z "$RAILWAY_DOMAIN" ]; then
    RAILWAY_DOMAIN=$(railway variables --kv 2>/dev/null | grep "^RAILWAY_STATIC_URL=" | cut -d'=' -f2)
fi

echo "Railway domain: $RAILWAY_DOMAIN"
echo ""

# Legacy variables to remove (set to empty)
LEGACY_VARS=(
    "AUTH_URL"
    "ENABLE_DISTRIBUTED_RATE_LIMITING"
    "ENABLE_FILE_LOGS"
    "INSTAGRAM_ACCESS_TOKEN"
    "RAPIDAPI_KEY"
    "REDIS_HOST"
    "REDIS_PORT"
    "REDIS_PASSWORD"
    "TWITTER_ACCESS_SECRET"
    "TWITTER_ACCESS_TOKEN"
    "TWITTER_API_KEY"
    "TWITTER_API_SECRET"
    "TWITTER_BEARER_TOKEN"
    "TWITTER_CLIENT_ID"
    "TWITTER_CLIENT_SECRET"
    "YOUTUBE_CLIENT_ID"
    "YOUTUBE_CLIENT_SECRET"
    "YOUTUBE_REDIRECT_URI"
    "YOUTUBE_REFRESH_TOKEN"
    "UPSTASH_REDIS_REST_TOKEN"
    "UPSTASH_REDIS_REST_URL"
)

echo -e "${YELLOW}Removing ${#LEGACY_VARS[@]} legacy variables...${NC}\n"

# Build command to remove legacy vars
REMOVE_VARS=()
for var in "${LEGACY_VARS[@]}"; do
    REMOVE_VARS+=("--set" "$var=")
    echo "  - Removing $var"
done

# Update NEXTAUTH_URL to use new domain
if [ -n "$RAILWAY_DOMAIN" ]; then
    REMOVE_VARS+=("--set" "NEXTAUTH_URL=https://$RAILWAY_DOMAIN")
    echo ""
    echo -e "${GREEN}Updating NEXTAUTH_URL to https://$RAILWAY_DOMAIN${NC}"
fi

# Execute cleanup
echo ""
echo -e "${GREEN}Executing cleanup...${NC}"
railway variables "${REMOVE_VARS[@]}" --skip-deploys

echo ""
echo -e "${GREEN}✓ Cleanup complete!${NC}"
echo ""
echo "Remaining essential variables:"
railway variables --kv | grep -E "^(DATABASE_URL|REDIS_URL|AUTH_SECRET|ENCRYPTION_KEY|NEXTAUTH_URL|NODE_ENV|LOG_LEVEL|ADMIN_EMAIL|ADMIN_PASSWORD)=" | sed 's/=.*/=***/' || true
