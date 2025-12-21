#!/bin/bash
# Manual Smoke Test Script
# Run this after deploying to staging to verify core functionality

set -e

FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
BACKEND_URL=${BACKEND_URL:-http://localhost:8000}

echo "=== POS System Manual Smoke Tests ==="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

check() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    status=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo "✓ PASS: $name (HTTP $status)"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL: $name (Expected HTTP $expected_status, got $status)"
        ((FAIL_COUNT++))
    fi
}

echo "=== Health Endpoint Tests ==="
check "Backend Health" "$BACKEND_URL/health" 200
check "Backend Root" "$BACKEND_URL/" 200
check "API Docs" "$BACKEND_URL/docs" 200
check "ReDoc" "$BACKEND_URL/redoc" 200

echo ""
echo "=== Frontend Page Tests ==="
check "Homepage" "$FRONTEND_URL/" 200
check "Products Page" "$FRONTEND_URL/products" 200
check "Vendors Page" "$FRONTEND_URL/vendors" 200
check "Transactions Page" "$FRONTEND_URL/transactions" 200
check "Dashboard Page" "$FRONTEND_URL/dashboard" 200

echo ""
echo "=== API Endpoint Tests ==="
check "Products API" "$BACKEND_URL/products/" 200
check "Vendors API" "$BACKEND_URL/vendors/" 200
check "Transactions API" "$BACKEND_URL/transactions/" 200

echo ""
echo "=== JSON Response Validation ==="
echo "Backend Health Response:"
curl -s "$BACKEND_URL/health" | jq . 2>/dev/null || echo "Could not parse JSON"

echo ""
echo "Backend Root Response:"
curl -s "$BACKEND_URL/" | jq . 2>/dev/null || echo "Could not parse JSON"

echo ""
echo "=== Test Summary ==="
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "SMOKE TESTS FAILED"
    exit 1
else
    echo "ALL SMOKE TESTS PASSED"
    exit 0
fi
