# Testing POST /api/publish

## Prerequisites

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Create topics first:**
   ```bash
   curl -X POST http://localhost:3000/api/topics \
     -H "Content-Type: application/json" \
     -d '{"name":"orders"}'
   ```

---

## Basic Publish Tests

### Test 1: Publish Message with Explicit ID

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-001",
      "payload": {"order": "Order #1", "amount": 100}
    }
  }'
```

**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "topic": "orders",
  "message_id": "msg-001",
  "broadcast": true
}
```

**Note:** `broadcast: false` if Pusher is not configured.

---

### Test 2: Publish Without ID (Auto-Generate UUID)

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "payload": {"order": "Order #2", "amount": 200}
    }
  }'
```

**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "topic": "orders",
  "message_id": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
  "broadcast": true
}
```

The `message_id` will be a generated UUID.

---

### Test 3: Publish with Request ID Tracking

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-003",
      "payload": {"order": "Order #3", "amount": 300}
    },
    "request_id": "req-abc-123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "topic": "orders",
  "message_id": "msg-003",
  "broadcast": true,
  "request_id": "req-abc-123"
}
```

The `request_id` is echoed back for tracking.

---

## Error Cases

### Test 4: Non-Existent Topic (404)

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "nonexistent",
    "message": {
      "id": "msg-999",
      "payload": {"test": true}
    }
  }'
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Topic not found",
  "code": "TOPIC_NOT_FOUND",
  "message": "Topic 'nonexistent' does not exist. Create it first using POST /api/topics",
  "topic": "nonexistent"
}
```

---

### Test 5: Missing Topic Field (400)

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "id": "msg-bad",
      "payload": {"test": true}
    }
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "code": "INVALID_TOPIC",
  "message": "Topic is required and must be a string"
}
```

---

### Test 6: Missing Message Field (400)

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "code": "INVALID_MESSAGE",
  "message": "Message is required and must be an object"
}
```

---

### Test 7: Missing Payload in Message (400)

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-no-payload"
    }
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Bad request",
  "code": "MISSING_PAYLOAD",
  "message": "Message must have a payload field"
}
```

---

### Test 8: Wrong HTTP Method (405)

```bash
curl -X GET http://localhost:3000/api/publish
```

**Expected Response (405 Method Not Allowed):**
```json
{
  "error": "Method not allowed",
  "message": "Method GET is not supported for this endpoint",
  "allowedMethods": ["POST"]
}
```

---

## Automated Test Script

Run all tests automatically:

```bash
./testApiPublish.sh
```

---

## Verifying Pusher Integration

### Option 1: Check Pusher Dashboard

1. Go to https://dashboard.pusher.com/
2. Select your app
3. Go to "Debug Console"
4. Publish a message using the curl command
5. You should see the event appear in the console

**Event details you'll see:**
- **Channel:** `topic-orders`
- **Event:** `event-message`
- **Data:**
  ```json
  {
    "id": "msg-001",
    "payload": {"order": "Order #1", "amount": 100},
    "ts": "2025-11-07T12:34:56.789Z"
  }
  ```

---

### Option 2: Check Server Logs

Watch your terminal where `npm run dev` is running. You should see:

```
✓ Message stored in topic 'orders': msg-001
✓ Message broadcasted to Pusher channel 'topic-orders': msg-001
```

---

### Option 3: Frontend Subscriber (Coming Soon)

Once the frontend is built, you can:
1. Open http://localhost:3000 in browser
2. Subscribe to a topic
3. Publish messages via curl
4. See them appear in real-time on the page

---

## Complete Test Flow

```bash
# 1. Create topic
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'

# 2. Publish message 1
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-001",
      "payload": {"order": "Widget", "qty": 5}
    }
  }'

# 3. Publish message 2 (no ID - will auto-generate)
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "payload": {"order": "Gadget", "qty": 3}
    }
  }'

# 4. List all topics (should show message count)
curl http://localhost:3000/api/topics

# 5. Check Pusher Dashboard for the events
```

---

## Response Format Summary

### Success Response

```json
{
  "status": "ok",
  "topic": "orders",
  "message_id": "msg-001",
  "broadcast": true,
  "request_id": "optional-echo"
}
```

### Success Without Pusher

```json
{
  "status": "ok",
  "topic": "orders",
  "message_id": "msg-001",
  "broadcast": false,
  "warning": "Message stored but not broadcasted (Pusher not configured)"
}
```

### Error Response

```json
{
  "error": "Error type",
  "code": "ERROR_CODE",
  "message": "Human-readable description"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOPIC` | 400 | Topic field missing or invalid |
| `INVALID_MESSAGE` | 400 | Message field missing or invalid |
| `MISSING_PAYLOAD` | 400 | Message.payload is required |
| `TOPIC_NOT_FOUND` | 404 | Topic doesn't exist |
| `STORAGE_ERROR` | 500 | Failed to store in memory |
| `INVALID_JSON` | 400 | Malformed JSON in request |
| `SERVER_ERROR` | 500 | Unexpected server error |

---

## Features Implemented

✅ **UUID Generation** - Auto-generates if message.id missing  
✅ **UUID Validation** - Warns if ID doesn't look like UUID  
✅ **Topic Validation** - Returns 404 TOPIC_NOT_FOUND if not exists  
✅ **Payload Validation** - Ensures message has payload  
✅ **Memory Storage** - Stores in topicsManager ring buffer  
✅ **Pusher Broadcast** - Triggers real-time event  
✅ **Request ID Echo** - Returns request_id if provided  
✅ **Graceful Degradation** - Works without Pusher (stores only)  
✅ **Error Handling** - Comprehensive error codes and messages  

---

## UUID Helper Details

The endpoint uses a custom UUID helper (`lib/uuidHelper.js`):

1. **Prefers `crypto.randomUUID()`** (Node 14.17+)
2. **Fallback:** Timestamp + random for older Node versions
3. **Validation:** Relaxed pattern matching for UUID-ish strings

**Example generated UUIDs:**
- Native: `a1b2c3d4-e5f6-4789-abcd-ef0123456789`
- Fallback: `01ab2cd3-ef45-4678-90ab-cdef12345678`

---

## What Happens on Publish

1. **Validate** request (topic exists, message valid)
2. **Generate UUID** if message.id missing
3. **Store** message in topicsManager (ring buffer)
4. **Broadcast** via Pusher to `topic-<name>` channel
5. **Return** acknowledgment with status

**Data Flow:**
```
Client → POST /api/publish
       ↓
  Validate topic exists
       ↓
  Generate UUID if needed
       ↓
  topicsManager.addMessage() → Memory storage
       ↓
  pusherServer.triggerMessage() → Pusher broadcast
       ↓
  Return 200 { status: 'ok' }
```

---

## Testing Without Pusher

If you haven't set up Pusher credentials yet:

1. Messages will still be stored in memory
2. Response will show `"broadcast": false`
3. You'll see a warning in the response
4. Check message storage by listing topics (message count increases)

This allows you to test the storage layer independently!

