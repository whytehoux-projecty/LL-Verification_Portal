#!/bin/bash

# LexNova Legal - Quick Test Script
# This script tests the backend API endpoints

API_URL="${API_URL:-http://localhost:8000}"
echo "🧪 Testing LexNova Legal Backend API"
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
}

echo "=== Health Checks ==="
test_endpoint "Health Check" "GET" "/health" "" "200"
test_endpoint "Metrics Endpoint" "GET" "/metrics" "" "200"
echo ""

echo "=== Authentication ==="
# Register a test user
REGISTER_DATA='{
  "email": "test@example.com",
  "password": "testpass123",
  "name": "Test User"
}'
test_endpoint "User Registration" "POST" "/api/auth/register" "$REGISTER_DATA" "200"

# Login
LOGIN_DATA='{
  "email": "test@example.com",
  "password": "testpass123"
}'
echo -n "Logging in... "
login_response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Token received)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} (No token received)"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "=== Session Management ==="
# Create session
SESSION_DATA='{
  "groomName": "John Doe",
  "brideName": "Jane Smith",
  "date": "2024-12-15",
  "aiConfig": {
    "voiceStyle": "warm",
    "strictness": "high"
  }
}'
echo -n "Creating session... "
session_response=$(curl -s -X POST "$API_URL/api/sessions" \
    -H "Content-Type: application/json" \
    -d "$SESSION_DATA")

SESSION_ID=$(echo "$session_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$SESSION_ID" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Session ID: $SESSION_ID)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC} (No session ID received)"
    echo "Response: $session_response"
    FAILED=$((FAILED + 1))
fi

# List sessions
test_endpoint "List Sessions" "GET" "/api/sessions" "" "200"
echo ""

echo "=== API Documentation ==="
test_endpoint "OpenAPI Docs" "GET" "/docs" "" "200"
test_endpoint "OpenAPI JSON" "GET" "/openapi.json" "" "200"
echo ""

echo "==================================="
echo "Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "==================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
