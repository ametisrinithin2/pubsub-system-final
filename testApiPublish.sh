#!/bin/bash

##
## Test script for POST /api/publish
##
## Prerequisites: npm run dev must be running in another terminal
##

BASE_URL="http://localhost:3000"
echo "=== Testing POST /api/publish endpoint ==="
echo ""

# Setup: Create test topics
echo "Setup: Creating test topics..."
curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}' > /dev/null

curl -s -X POST $BASE_URL/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}' > /dev/null

echo "✓ Created test topics: orders, notifications"
echo ""

# Test 1: Publish message with ID
echo "Test 1: Publish message with explicit ID"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-001",
      "payload": {"order": "Order #1", "amount": 100}
    }
  }' | jq '.'
echo ""

# Test 2: Publish message without ID (auto-generate UUID)
echo "Test 2: Publish message without ID (should auto-generate)"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "payload": {"order": "Order #2", "amount": 200}
    }
  }' | jq '.'
echo ""

# Test 3: Publish with request_id
echo "Test 3: Publish with request_id (should echo back)"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-003",
      "payload": {"order": "Order #3", "amount": 300}
    },
    "request_id": "req-abc-123"
  }' | jq '.'
echo ""

# Test 4: Publish to different topic
echo "Test 4: Publish to 'notifications' topic"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "notifications",
    "message": {
      "id": "notif-001",
      "payload": {"type": "alert", "message": "System update"}
    }
  }' | jq '.'
echo ""

# Test 5: Try to publish to non-existent topic (should get 404)
echo "Test 5: Publish to non-existent topic (should return 404)"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "nonexistent",
    "message": {
      "id": "msg-999",
      "payload": {"test": true}
    }
  }' | jq '.'
echo ""

# Test 6: Missing topic field (should return 400)
echo "Test 6: Missing topic field (should return 400)"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "id": "msg-bad",
      "payload": {"test": true}
    }
  }' | jq '.'
echo ""

# Test 7: Missing message field (should return 400)
echo "Test 7: Missing message field (should return 400)"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders"
  }' | jq '.'
echo ""

# Test 8: Missing payload in message (should return 400)
echo "Test 8: Missing payload in message (should return 400)"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-no-payload"
    }
  }' | jq '.'
echo ""

# Test 9: Invalid JSON (should return 400)
echo "Test 9: Invalid JSON (should return 400)"
curl -s -X POST $BASE_URL/api/publish \
  -H "Content-Type: application/json" \
  -d '{invalid json}' | jq '.'
echo ""

# Test 10: Wrong HTTP method (should return 405)
echo "Test 10: GET method (should return 405)"
curl -s -X GET $BASE_URL/api/publish | jq '.'
echo ""

# Test 11: Verify message history
echo "Test 11: Get message history from 'orders' topic"
curl -s "$BASE_URL/api/history?topic=orders&last_n=10" 2>/dev/null | jq '.' || echo "Note: /api/history not yet implemented"
echo ""

echo "=== All tests completed ==="
echo ""
echo "📝 To verify Pusher integration:"
echo "1. Check your terminal running 'npm run dev' for log messages"
echo "2. Visit Pusher Dashboard → Debug Console"
echo "3. You should see events on channels: topic-orders, topic-notifications"
echo ""
echo "To test with a real subscriber:"
echo "1. Open browser console at http://localhost:3000"
echo "2. Subscribe to a channel (see frontend integration docs)"
echo "3. Run publish commands and see messages appear in real-time"

