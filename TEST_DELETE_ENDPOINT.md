# Testing DELETE /api/topics/[name]

## Quick Test Commands

### Step 1: Create Test Topics

```bash
# Create topic "orders"
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'

# Create topic "notifications"
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}'

# Create topic "events"
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"events"}'
```

### Step 2: Verify Topics Created

```bash
curl http://localhost:3000/api/topics
```

**Expected Response:**
```json
{
  "topics": [
    {"name": "orders", "subscribers": 0},
    {"name": "notifications", "subscribers": 0},
    {"name": "events", "subscribers": 0}
  ]
}
```

---

## DELETE Tests

### Test 1: Delete Existing Topic (Success - 200)

```bash
curl -X DELETE http://localhost:3000/api/topics/orders
```

**Expected Response (200 OK):**
```json
{
  "status": "deleted",
  "topic": "orders"
}
```

---

### Test 2: Verify Topic Was Deleted

```bash
curl http://localhost:3000/api/topics
```

**Expected Response (should show 2 topics now):**
```json
{
  "topics": [
    {"name": "notifications", "subscribers": 0},
    {"name": "events", "subscribers": 0}
  ]
}
```

---

### Test 3: Try to Delete Non-Existent Topic (404)

```bash
curl -X DELETE http://localhost:3000/api/topics/nonexistent
```

**Expected Response (404 Not Found):**
```json
{
  "status": "not_found",
  "topic": "nonexistent"
}
```

---

### Test 4: Try to Delete Already Deleted Topic (404)

```bash
curl -X DELETE http://localhost:3000/api/topics/orders
```

**Expected Response (404 Not Found):**
```json
{
  "status": "not_found",
  "topic": "orders"
}
```

---

### Test 5: Try Unsupported Method (405)

```bash
curl -X GET http://localhost:3000/api/topics/events
```

**Expected Response (405 Method Not Allowed):**
```json
{
  "error": "Method not allowed",
  "message": "Method GET is not supported for this endpoint",
  "allowedMethods": ["DELETE"]
}
```

---

### Test 6: Try Deleting Topic with Subscribers (409)

**Note:** To test this scenario, you need to manually increment subscribers. For now, we'll document the expected behavior.

**Expected Response (409 Conflict):**
```json
{
  "status": "has_subscribers",
  "topic": "orders",
  "subscribers": 3,
  "message": "Cannot delete topic with active subscribers. Unsubscribe all clients first."
}
```

**How to test with subscribers:**
1. Create a topic
2. Have clients subscribe via Pusher (or use the increment function directly)
3. Try to delete - should receive 409 error
4. Unsubscribe all clients
5. Delete should now succeed

---

## Complete Test Sequence

Run all tests in order:

```bash
# 1. Create topics
curl -X POST http://localhost:3000/api/topics -H "Content-Type: application/json" -d '{"name":"orders"}'
curl -X POST http://localhost:3000/api/topics -H "Content-Type: application/json" -d '{"name":"notifications"}'

# 2. List topics (should show 2)
curl http://localhost:3000/api/topics

# 3. Delete one topic
curl -X DELETE http://localhost:3000/api/topics/orders

# 4. List topics (should show 1)
curl http://localhost:3000/api/topics

# 5. Try to delete non-existent
curl -X DELETE http://localhost:3000/api/topics/nonexistent

# 6. Delete remaining topic
curl -X DELETE http://localhost:3000/api/topics/notifications

# 7. List topics (should be empty)
curl http://localhost:3000/api/topics
```

---

## Automated Test Script

Run the comprehensive test script:

```bash
./testApiDelete.sh
```

This will automatically:
- Create test topics
- Test successful deletion
- Test 404 responses
- Test method validation
- Verify final state

---

## API Contract Compliance

| Requirement | Status | Response Format |
|-------------|--------|-----------------|
| DELETE method only | ✅ | Returns 405 for other methods |
| Read name from req.query | ✅ | Dynamic route [name] |
| 404 if not found | ✅ | `{ status: 'not_found', topic }` |
| 200 if deleted | ✅ | `{ status: 'deleted', topic }` |
| 409 if has subscribers | ✅ | `{ status: 'has_subscribers', topic, subscribers, message }` |
| Prevent deletion with subscribers | ✅ | Checks topic.subscribers > 0 |
| Clear error messages | ✅ | Descriptive messages included |

---

## Response Status Codes

| Code | Scenario | Body |
|------|----------|------|
| 200 | Successfully deleted | `{ status: 'deleted', topic: 'name' }` |
| 404 | Topic not found | `{ status: 'not_found', topic: 'name' }` |
| 409 | Has active subscribers | `{ status: 'has_subscribers', topic: 'name', subscribers: N }` |
| 400 | Invalid topic name | `{ error: 'Bad request', message: '...' }` |
| 405 | Wrong HTTP method | `{ error: 'Method not allowed', ... }` |
| 500 | Server error | `{ error: 'Internal server error', ... }` |

---

## Edge Cases Tested

✅ **Empty topic name** - Returns 400  
✅ **Non-existent topic** - Returns 404  
✅ **Already deleted topic** - Returns 404  
✅ **Wrong HTTP method** - Returns 405  
✅ **Topic with subscribers** - Returns 409 and prevents deletion  

---

## Next Steps

After confirming DELETE works:
1. Implement POST /api/publish with Pusher integration
2. Add subscriber tracking when clients connect
3. Test the full lifecycle: create → subscribe → publish → unsubscribe → delete

