# API Flow Documentation

## POST /api/topics - Create Topic

### Request Flow

```
Client                    API Route                   Topics Manager
  |                          |                              |
  |  POST /api/topics        |                              |
  |  { "name": "orders" }    |                              |
  |------------------------->|                              |
  |                          |                              |
  |                          | Validate request body        |
  |                          | - Check name exists          |
  |                          | - Check name is string       |
  |                          | - Check name not empty       |
  |                          |                              |
  |                          | createTopic("orders")        |
  |                          |----------------------------->|
  |                          |                              |
  |                          |                              | Check if exists
  |                          |                              | Create topic object
  |                          |                              | Store in Map
  |                          |                              |
  |                          | { success: true, topic }     |
  |                          |<-----------------------------|
  |                          |                              |
  |  201 Created             |                              |
  |  { status: "created",    |                              |
  |    topic: "orders" }     |                              |
  |<-------------------------|                              |
```

### Response Codes

| Code | Scenario | Response Body |
|------|----------|---------------|
| 201 | Topic created successfully | `{ "status": "created", "topic": "orders" }` |
| 409 | Topic already exists | `{ "status": "exists", "topic": "orders" }` |
| 400 | Invalid input (empty, wrong type) | `{ "error": "Bad request", "message": "..." }` |
| 405 | Wrong HTTP method | `{ "error": "Method not allowed", ... }` |
| 500 | Server error | `{ "error": "Internal server error", ... }` |

### Validation Rules

1. **Name is required**: `name` field must be present in request body
2. **Name must be string**: Type check for string
3. **Name cannot be empty**: After trim(), must have length > 0
4. **Duplicate check**: Returns 409 if topic already exists

## GET /api/topics - List Topics

### Request Flow

```
Client                    API Route                   Topics Manager
  |                          |                              |
  |  GET /api/topics         |                              |
  |------------------------->|                              |
  |                          |                              |
  |                          | listTopics()                 |
  |                          |----------------------------->|
  |                          |                              |
  |                          |                              | Iterate over Map
  |                          |                              | Build array
  |                          |                              |
  |                          | [{name, subscribers}, ...]   |
  |                          |<-----------------------------|
  |                          |                              |
  |  200 OK                  |                              |
  |  { "topics": [...] }     |                              |
  |<-------------------------|                              |
```

### Response Format

```json
{
  "topics": [
    {
      "name": "orders",
      "subscribers": 0
    },
    {
      "name": "notifications",
      "subscribers": 3
    }
  ]
}
```

### Response Codes

| Code | Scenario | Response Body |
|------|----------|---------------|
| 200 | Success (even if empty) | `{ "topics": [...] }` |
| 405 | Wrong HTTP method | `{ "error": "Method not allowed", ... }` |
| 500 | Server error | `{ "error": "Internal server error", ... }` |

## Implementation Details

### File Structure

```
pages/api/topics.js
├── Imports topicsManager functions
├── Exports async handler function
├── Handles GET method → listTopics()
├── Handles POST method → createTopic()
└── Returns 405 for other methods
```

### Key Features

✅ **Method routing** - GET and POST in same file
✅ **Comprehensive validation** - Multiple checks on input
✅ **Proper status codes** - Semantic HTTP codes (201, 409, 400, 405)
✅ **Error handling** - Try-catch blocks with meaningful messages
✅ **No external deps** - Pure JavaScript validation
✅ **Inline documentation** - Curl examples in comments

### Contract Compliance

The implementation strictly follows the assignment contract:

| Requirement | Implementation |
|-------------|----------------|
| `POST /api/topics` | ✅ Implemented |
| Request: `{ "name": "orders" }` | ✅ Validated |
| 201: `{ "status": "created", "topic": "..." }` | ✅ Exact format |
| 409: `{ "status": "exists", "topic": "..." }` | ✅ Exact format |
| `GET /api/topics` | ✅ Implemented |
| Response: `{ "topics": [...] }` | ✅ Exact format |
| 400 for bad input | ✅ Comprehensive validation |

## Testing

### Manual Testing

```bash
# Start server
npm run dev

# Test GET (empty)
curl http://localhost:3000/api/topics

# Test POST (create)
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'

# Test POST (duplicate - should get 409)
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'

# Test GET (with data)
curl http://localhost:3000/api/topics
```

### Automated Testing

Run the provided test script:

```bash
./testApiTopics.sh
```

This will run all test cases including edge cases (empty names, invalid JSON, wrong methods, etc.).

