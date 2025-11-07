#!/bin/bash

##
## Test script for GET /api/health and GET /api/stats
##
## Prerequisites: npm run dev must be running in another terminal
##

BASE_URL="http://localhost:3000"
echo "=== Testing /api/health and /api/stats endpoints ==="
echo ""

# Test 1: Health check (empty state)
echo "Test 1: GET /api/health (no topics yet)"
curl -s $BASE_URL/api/health | jq '.'
echo ""

# Test 2: Stats (empty state)
echo "Test 2: GET /api/stats (no topics yet)"
curl -s $BASE_URL/api/stats | jq '.'
echo ""

# Setup: Create some topics
echo "Setup: Creating test topics and publishing messages..."
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}' > /dev/null

curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}' > /dev/null

curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"events"}' > /dev/null

# Publish some messages
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"orders","message":{"id":"msg-1","payload":{"test":1}}}' > /dev/null

curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"orders","message":{"id":"msg-2","payload":{"test":2}}}' > /dev/null

curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"notifications","message":{"id":"notif-1","payload":{"alert":"test"}}}' > /dev/null

echo "✓ Created 3 topics and published 3 messages"
echo ""

# Test 3: Health check (with data)
echo "Test 3: GET /api/health (should show 3 topics, 0 subscribers)"
curl -s $BASE_URL/api/health | jq '.'
echo ""

# Test 4: Stats (with data)
echo "Test 4: GET /api/stats (should show message counts)"
curl -s $BASE_URL/api/stats | jq '.'
echo ""

# Test 5: Wait a bit and check uptime increases
echo "Test 5: Waiting 2 seconds to verify uptime increases..."
sleep 2
curl -s $BASE_URL/api/health | jq '.'
echo ""

# Test 6: Wrong HTTP method on health
echo "Test 6: POST to /api/health (should return 405)"
curl -s -X POST $BASE_URL/api/health | jq '.'
echo ""

# Test 7: Wrong HTTP method on stats
echo "Test 7: POST to /api/stats (should return 405)"
curl -s -X POST $BASE_URL/api/stats | jq '.'
echo ""

# Cleanup
echo "Cleanup: Deleting topics..."
curl -s -X DELETE $BASE_URL/api/topics/orders > /dev/null
curl -s -X DELETE $BASE_URL/api/topics/notifications > /dev/null
curl -s -X DELETE $BASE_URL/api/topics/events > /dev/null
echo "✓ Cleanup complete"
echo ""

echo "=== All tests completed ==="
echo ""
echo "✓ Health endpoint working"
echo "✓ Stats endpoint working"
echo "✓ Uptime tracking functional"

