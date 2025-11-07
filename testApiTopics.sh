#!/bin/bash

##
## Test script for POST /api/topics and GET /api/topics
##
## Prerequisites: npm run dev must be running in another terminal
##

BASE_URL="http://localhost:3000"
echo "=== Testing /api/topics endpoint ==="
echo ""

# Test 1: List topics (should be empty initially)
echo "Test 1: GET /api/topics (empty list)"
curl -s $BASE_URL/api/topics | jq '.'
echo ""
echo ""

# Test 2: Create first topic "orders"
echo "Test 2: POST /api/topics (create 'orders')"
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}' | jq '.'
echo ""
echo ""

# Test 3: Create second topic "notifications"
echo "Test 3: POST /api/topics (create 'notifications')"
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}' | jq '.'
echo ""
echo ""

# Test 4: Try to create duplicate "orders" (should return 409)
echo "Test 4: POST /api/topics (duplicate 'orders' - expect 409)"
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}' | jq '.'
echo ""
echo ""

# Test 5: List all topics (should show 2 topics)
echo "Test 5: GET /api/topics (should show 2 topics)"
curl -s $BASE_URL/api/topics | jq '.'
echo ""
echo ""

# Test 6: Try to create topic with empty name (should return 400)
echo "Test 6: POST /api/topics (empty name - expect 400)"
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":""}' | jq '.'
echo ""
echo ""

# Test 7: Try to create topic without name field (should return 400)
echo "Test 7: POST /api/topics (missing name - expect 400)"
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""
echo ""

# Test 8: Try invalid JSON (should return 400)
echo "Test 8: POST /api/topics (invalid JSON - expect 400)"
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{invalid json}' | jq '.'
echo ""
echo ""

# Test 9: Try unsupported method (should return 405)
echo "Test 9: PUT /api/topics (unsupported method - expect 405)"
curl -s -X PUT $BASE_URL/api/topics | jq '.'
echo ""
echo ""

echo "=== All tests completed ==="

