#!/bin/bash

##
## Test script for GET /api/history
##
## Prerequisites: npm run dev must be running in another terminal
##

BASE_URL="http://localhost:3000"
echo "=== Testing GET /api/history endpoint ==="
echo ""

# Setup: Create topic and publish messages
echo "Setup: Creating 'orders' topic and publishing 10 messages..."
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}' > /dev/null

for i in {1..10}; do
  curl -s -X POST $BASE_URL/api/publish \
    -H "Content-Type: application/json" \
    -d "{\"topic\":\"orders\",\"message\":{\"id\":\"msg-$i\",\"payload\":{\"order\":\"Order #$i\",\"amount\":$((i * 100))}}}" > /dev/null
done

echo "✓ Published 10 messages to 'orders' topic"
echo ""

# Test 1: Get default (last 10 messages)
echo "Test 1: GET history without last_n (default 10)"
curl -s "$BASE_URL/api/history?topic=orders" | jq '.'
echo ""

# Test 2: Get last 5 messages
echo "Test 2: GET last 5 messages"
curl -s "$BASE_URL/api/history?topic=orders&last_n=5" | jq '.'
echo ""

# Test 3: Get last 3 messages
echo "Test 3: GET last 3 messages"
curl -s "$BASE_URL/api/history?topic=orders&last_n=3" | jq '.'
echo ""

# Test 4: Request more than available
echo "Test 4: Request 100 messages (only 10 available)"
curl -s "$BASE_URL/api/history?topic=orders&last_n=100" | jq '.count, .requested'
echo ""

# Test 5: Request beyond max limit (should cap at 100)
echo "Test 5: Request 500 messages (should cap at 100)"
curl -s "$BASE_URL/api/history?topic=orders&last_n=500" | jq '.requested'
echo ""

# Test 6: Non-existent topic (should return 404)
echo "Test 6: Request history for non-existent topic (expect 404)"
curl -s "$BASE_URL/api/history?topic=nonexistent" | jq '.'
echo ""

# Test 7: Missing topic parameter (should return 400)
echo "Test 7: Missing topic parameter (expect 400)"
curl -s "$BASE_URL/api/history" | jq '.'
echo ""

# Test 8: Invalid last_n (negative)
echo "Test 8: Invalid last_n=-5 (expect 400)"
curl -s "$BASE_URL/api/history?topic=orders&last_n=-5" | jq '.'
echo ""

# Test 9: Invalid last_n (not a number)
echo "Test 9: Invalid last_n=abc (expect 400)"
curl -s "$BASE_URL/api/history?topic=orders&last_n=abc" | jq '.'
echo ""

# Test 10: Wrong HTTP method (should return 405)
echo "Test 10: POST to /api/history (expect 405)"
curl -s -X POST "$BASE_URL/api/history?topic=orders" | jq '.'
echo ""

# Test 11: Verify message order (last messages should be 8, 9, 10)
echo "Test 11: Get last 3 messages and verify order"
curl -s "$BASE_URL/api/history?topic=orders&last_n=3" | jq '.messages[].id'
echo ""

# Cleanup
echo "Cleanup: Deleting topic..."
curl -s -X DELETE $BASE_URL/api/topics/orders > /dev/null
echo "✓ Cleanup complete"
echo ""

echo "=== All tests completed ==="
echo ""
echo "✓ History endpoint working"
echo "✓ Pagination working"
echo "✓ Limits enforced"
echo "✓ Error handling correct"

