#!/bin/bash
# Phase 4 API Test Script
# Tests all new Phase 4 endpoints to verify integration

BASE_URL="${1:-http://localhost:8200}"
PROJECT_ID="${2:-test-project-id}"

echo "🧪 Phase 4 API Integration Tests"
echo "================================="
echo "Base URL: $BASE_URL"
echo "Project ID: $PROJECT_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s "$BASE_URL$endpoint" -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        echo "  Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body | head -c 100)"
    else
        echo -e "${RED}✗ FAIL${NC} ($http_code)"
        echo "  Error: $(echo $body | head -c 200)"
    fi
    echo ""
}

echo "📡 1. Health & Metrics Endpoints"
echo "--------------------------------"
test_endpoint "Basic Health" "GET" "/health"
test_endpoint "Detailed Health" "GET" "/health/detailed"
test_endpoint "Prometheus Metrics" "GET" "/metrics"

echo "💱 2. Currency Endpoints"
echo "------------------------"
test_endpoint "Supported Currencies" "GET" "/api/v1/currency/supported"
test_endpoint "Exchange Rates" "GET" "/api/v1/currency/rates?base=USD"
test_endpoint "Currency Conversion" "POST" "/api/v1/currency/convert" \
    '{"amount": 1000, "from_currency": "IDR", "to_currency": "USD"}'

echo "📊 3. Forensic Chronology"
echo "------------------------"
test_endpoint "Get Chronology" "GET" "/api/v1/forensic-tools/$PROJECT_ID/chronology"

echo "🤖 4. Semantic Matching"
echo "----------------------"
test_endpoint "Semantic Matches" "POST" "/api/v1/reconciliation/$PROJECT_ID/semantic?threshold=0.75"

echo ""
echo "================================="
echo "✅ Phase 4 API Tests Complete"
echo ""
echo "📝 Notes:"
echo "  - Some endpoints may return errors if no data exists (expected)"
echo "  - Currency conversion requires internet for live rates"
echo "  - Semantic matching requires sentence-transformers installed"
echo "  - Chronology/matching require project data in database"
echo ""
echo "🚀 If all endpoints return 200 status, integration is successful!"
