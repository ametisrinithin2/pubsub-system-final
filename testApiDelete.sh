#!/bin/bash

##
## Test script for DELETE /api/topics/[name]
##
## Prerequisites: npm run dev must be running in another terminal
##

BASE_URL="http://localhost:3000"
echo "=== Testing DELETE /api/topics/[name] endpoint ==="
echo ""

# Setup: Create some test topics first
echo "Setup: Creating test topics..."
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}' > /dev/null

curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}' > /dev/null

curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"events"}' > /dev/null

echo "✓ Created 3 test topics"
echo ""

# Test 1: List topics before deletion
echo "Test 1: List all topics (should show 3)"
curl -s $BASE_URL/api/topics | jq '.'
echo ""

# Test 2: Delete existing topic
echo "Test 2: DELETE /api/topics/orders (should succeed - 200)"
curl -s -X DELETE $BASE_URL/api/topics/orders | jq '.'
echo ""

# Test 3: Verify topic was deleted
echo "Test 3: List topics after deletion (should show 2)"
curl -s $BASE_URL/api/topics | jq '.'
echo ""

# Test 4: Try to delete non-existent topic
echo "Test 4: DELETE non-existent topic (should return 404)"
curl -s -X DELETE $BASE_URL/api/topics/nonexistent | jq '.'
echo ""

# Test 5: Try to delete already deleted topic
echo "Test 5: DELETE already deleted topic 'orders' (should return 404)"
curl -s -X DELETE $BASE_URL/api/topics/orders | jq '.'
echo ""

# Test 6: Delete another existing topic
echo "Test 6: DELETE /api/topics/notifications (should succeed - 200)"
curl -s -X DELETE $BASE_URL/api/topics/notifications | jq '.'
echo ""

# Test 7: Try empty name
echo "Test 7: DELETE with empty name (should return 400)"
curl -s -X DELETE "$BASE_URL/api/topics/ " | jq '.'
echo ""

# Test 8: Try unsupported method
echo "Test 8: GET on delete endpoint (should return 405)"
curl -s -X GET $BASE_URL/api/topics/events | jq '.'
echo ""

# Test 9: Final cleanup - delete last topic
echo "Test 9: DELETE last topic 'events'"
curl -s -X DELETE $BASE_URL/api/topics/events | jq '.'
echo ""

# Test 10: Verify all deleted
echo "Test 10: List topics (should be empty)"
curl -s $BASE_URL/api/topics | jq '.'
echo ""

echo "=== All tests completed ==="
echo ""
echo "Note: To test the 409 (has_subscribers) scenario, you would need to:"
echo "1. Create a topic"
echo "2. Have a client subscribe via Pusher (or manually increment subscribers)"
echo "3. Try to delete - should get 409 error"

