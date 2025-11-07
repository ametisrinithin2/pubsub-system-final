# Testing Health, Stats, and History Endpoints

## Prerequisites

Start the dev server:
```bash
npm run dev
```

---

## GET /api/health Tests

### Test 1: Health Check (Empty State)

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "uptime_sec": 5.123,
  "topics": 0,
  "subscribers": 0
}
```

---

### Test 2: Health Check (With Topics)

Create some topics first:
```bash
# Create topics
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'

curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}'

# Check health
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "uptime_sec": 10.456,
  "topics": 2,
  "subscribers": 0
}
```

---

### Test 3: Verify Uptime Increases

```bash
# Check uptime
curl http://localhost:3000/api/health

# Wait 5 seconds
sleep 5

# Check again - uptime_sec should be ~5 seconds higher
curl http://localhost:3000/api/health
```

---

## GET /api/stats Tests

### Test 1: Stats (Empty State)

```bash
curl http://localhost:3000/api/stats
```

**Expected Response:**
```json
{
  "topics": {}
}
```

---

### Test 2: Stats (With Topics and Messages)

```bash
# Create topic
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'

# Publish messages
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"orders","message":{"id":"msg-1","payload":{"test":1}}}'

curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"orders","message":{"id":"msg-2","payload":{"test":2}}}'

curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"orders","message":{"id":"msg-3","payload":{"test":3}}}'

# Check stats
curl http://localhost:3000/api/stats
```

**Expected Response:**
```json
{
  "topics": {
    "orders": {
      "messages": 3,
      "subscribers": 0,
      "bufferSize": 3,
      "bufferCapacity": 100
    }
  }
}
```

---

### Test 3: Stats (Multiple Topics)

```bash
# Create another topic and publish
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}'

curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{"topic":"notifications","message":{"id":"notif-1","payload":{"alert":"test"}}}'

# Check stats
curl http://localhost:3000/api/stats
```

**Expected Response:**
```json
{
  "topics": {
    "orders": {
      "messages": 3,
      "subscribers": 0,
      "bufferSize": 3,
      "bufferCapacity": 100
    },
    "notifications": {
      "messages": 1,
      "subscribers": 0,
      "bufferSize": 1,
      "bufferCapacity": 100
    }
  }
}
```

---

## GET /api/history Tests

### Setup: Create Topic and Publish Messages

```bash
# Create topic
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'

# Publish 10 messages
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/publish \
    -H "Content-Type: application/json" \
    -d "{\"topic\":\"orders\",\"message\":{\"id\":\"msg-$i\",\"payload\":{\"order\":\"Order #$i\",\"amount\":$((i * 100))}}}"
done
```

---

### Test 1: Get Last 5 Messages

```bash
curl "http://localhost:3000/api/history?topic=orders&last_n=5"
```

**Expected Response:**
```json
{
  "topic": "orders",
  "messages": [
    {
      "id": "msg-6",
      "payload": {"order": "Order #6", "amount": 600},
      "timestamp": "2025-11-07T12:34:56.789Z"
    },
    {
      "id": "msg-7",
      "payload": {"order": "Order #7", "amount": 700},
      "timestamp": "2025-11-07T12:34:57.012Z"
    },
    {
      "id": "msg-8",
      "payload": {"order": "Order #8", "amount": 800},
      "timestamp": "2025-11-07T12:34:57.234Z"
    },
    {
      "id": "msg-9",
      "payload": {"order": "Order #9", "amount": 900},
      "timestamp": "2025-11-07T12:34:57.456Z"
    },
    {
      "id": "msg-10",
      "payload": {"order": "Order #10", "amount": 1000},
      "timestamp": "2025-11-07T12:34:57.678Z"
    }
  ],
  "count": 5,
  "requested": 5
}
```

---

### Test 2: Get Default (Last 10)

```bash
curl "http://localhost:3000/api/history?topic=orders"
```

**Expected:** All 10 messages with `"count": 10, "requested": 10`

---

### Test 3: Request More Than Available

```bash
curl "http://localhost:3000/api/history?topic=orders&last_n=100"
```

**Expected:** All 10 messages with `"count": 10, "requested": 100`

---

### Test 4: Request Beyond Max Limit

```bash
curl "http://localhost:3000/api/history?topic=orders&last_n=500"
```

**Expected:** Gets capped at 100, response shows `"requested": 100`

---

### Test 5: Non-Existent Topic (404)

```bash
curl "http://localhost:3000/api/history?topic=nonexistent"
```

**Expected Response (404 Not Found):**
```json
{
  "error": {
    "code": "TOPIC_NOT_FOUND",
    "message": "Topic 'nonexistent' does not exist"
  }
}
```

---

### Test 6: Missing Topic Parameter (400)

```bash
curl "http://localhost:3000/api/history"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "INVALID_TOPIC",
    "message": "Topic query parameter is required and must be a string"
  }
}
```

---

### Test 7: Invalid last_n (400)

```bash
curl "http://localhost:3000/api/history?topic=orders&last_n=-5"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "INVALID_LAST_N",
    "message": "last_n must be a positive integer"
  }
}
```

---

### Test 8: Invalid last_n (Not a Number)

```bash
curl "http://localhost:3000/api/history?topic=orders&last_n=abc"
```

**Expected Response (400 Bad Request):**
```json
{
  "error": {
    "code": "INVALID_LAST_N",
    "message": "last_n must be a positive integer"
  }
}
```

---

## Automated Test Scripts

### Test Health and Stats

```bash
./testApiHealthStats.sh
```

**Tests:**
- ✅ Health check with no topics
- ✅ Health check with topics
- ✅ Uptime increases over time
- ✅ Stats with no topics
- ✅ Stats with topics and messages
- ✅ Wrong HTTP methods return 405

---

### Test History

```bash
./testApiHistory.sh
```

**Tests:**
- ✅ Get default history (10 messages)
- ✅ Get specific count (last_n=5)
- ✅ Request more than available
- ✅ Request beyond max limit (caps at 100)
- ✅ Non-existent topic returns 404
- ✅ Missing parameters return 400
- ✅ Invalid parameters return 400
- ✅ Wrong HTTP methods return 405
- ✅ Message order is correct

---

## Complete Integration Test

Test all three endpoints together:

```bash
# 1. Check initial health
echo "1. Initial health check:"
curl http://localhost:3000/api/health
echo -e "\n"

# 2. Check initial stats
echo "2. Initial stats:"
curl http://localhost:3000/api/stats
echo -e "\n"

# 3. Create a topic
echo "3. Create topic:"
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'
echo -e "\n"

# 4. Publish some messages
echo "4. Publishing 5 messages..."
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/publish \
    -H "Content-Type: application/json" \
    -d "{\"topic\":\"orders\",\"message\":{\"id\":\"msg-$i\",\"payload\":{\"order\":$i}}}" > /dev/null
done
echo "Done"
echo -e "\n"

# 5. Check health again (should show 1 topic)
echo "5. Health after creating topic:"
curl http://localhost:3000/api/health
echo -e "\n"

# 6. Check stats (should show 5 messages)
echo "6. Stats after publishing:"
curl http://localhost:3000/api/stats
echo -e "\n"

# 7. Get message history
echo "7. Message history (last 3):"
curl "http://localhost:3000/api/history?topic=orders&last_n=3"
echo -e "\n"
```

---

## Response Format Summary

### Health Response
```json
{
  "uptime_sec": <number>,    // Seconds since server start
  "topics": <number>,         // Total topic count
  "subscribers": <number>     // Total subscriber count
}
```

### Stats Response
```json
{
  "topics": {
    "<topic_name>": {
      "messages": <number>,        // Total messages sent
      "subscribers": <number>,     // Current subscribers
      "bufferSize": <number>,      // Messages in buffer
      "bufferCapacity": <number>   // Max buffer size
    }
  }
}
```

### History Response
```json
{
  "topic": "<topic_name>",
  "messages": [
    {
      "id": "<message_id>",
      "payload": {...},
      "timestamp": "<ISO_8601>"
    }
  ],
  "count": <number>,      // Actual messages returned
  "requested": <number>   // Requested count (capped at 100)
}
```

---

## Contract Compliance

### /api/health
| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Returns uptime_sec | ✅ | Calculated from START_TS |
| Returns topics count | ✅ | From listTopics().length |
| Returns subscribers count | ✅ | Sum across all topics |
| Canonical format | ✅ | Exact spec match |

### /api/stats
| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Returns per-topic stats | ✅ | From getStats() |
| Shows message count | ✅ | Total messages sent |
| Shows subscribers | ✅ | Current count |
| Canonical format | ✅ | Exact spec match |

### /api/history
| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Validates topic exists | ✅ | Returns 404 if not found |
| Parses last_n integer | ✅ | Default 10, validates type |
| Max limit 100 | ✅ | Caps at MAX_LAST_N |
| Uses getHistory() | ✅ | From topicsManager |
| Returns {topic, messages} | ✅ | Plus count and requested |
| 404 TOPIC_NOT_FOUND | ✅ | Error code included |

---

## Features Summary

### /api/health
✅ Module-level START_TS for uptime tracking  
✅ Survives across requests (per process)  
✅ Resets on server restart  
✅ Sub-second precision (3 decimal places)  
✅ Aggregates subscriber counts  

### /api/stats
✅ Uses topicsManager.getStats()  
✅ Per-topic message counts  
✅ Per-topic subscriber counts  
✅ Buffer utilization info  
✅ Empty object {} when no topics  

### /api/history
✅ Query parameter validation  
✅ Default limit (10 messages)  
✅ Max limit enforcement (100 messages)  
✅ Topic existence check  
✅ Message order preserved (oldest to newest in last_n)  
✅ Includes metadata (count, requested)  
✅ Structured error responses  

All three endpoints are production-ready! 🚀

