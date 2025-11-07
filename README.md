# Next.js PubSub System with Pusher

A real-time publish-subscribe system built with Next.js and Pusher. Supports topic management, message publishing, and real-time message delivery to subscribers.

## Overview

This is a demonstration PubSub system featuring:

- **Backend:** Next.js API routes (Node.js serverless functions)
- **Frontend:** React with Pusher client for real-time updates
- **Storage:** In-memory (topics, messages, statistics)
- **Real-time:** Pusher WebSocket for message delivery and control events
- **Deployment:** Vercel-ready with Docker support for local/container deployments

**Key Features:**
- Topic creation and deletion with real-time UI sync
- Message publishing with automatic UUID generation
- Ring buffer (last 100 messages per topic) for replay
- Health and statistics endpoints
- Graceful shutdown for Docker/VM deployments
- Multi-tab synchronization via Pusher control events

---

## Local Setup

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000 to see the UI.

**Note:** Pusher credentials are already configured in the application. No additional setup required.

---

## API Endpoints

All endpoints return JSON. Server runs on port 3000 by default.

### POST /api/topics - Create Topic

Create a new topic in the system.

**Request (Local):**
```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'
```

**Request (Production):**
```bash
curl -X POST https://pubsub-system-final.vercel.app/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'
```

**Response (201 Created):**
```json
{
  "status": "created",
  "topic": "orders"
}
```

**Response (409 Conflict - already exists):**
```json
{
  "status": "exists",
  "topic": "orders"
}
```

**Pusher Event:** Emits `topic_created` on `control-topics` channel

---

### GET /api/topics - List Topics

List all topics with subscriber counts.

**Request (Local):**
```bash
curl http://localhost:3000/api/topics
```

**Request (Production):**
```bash
curl https://pubsub-system-final.vercel.app/api/topics
```



**Response (200 OK):**
```json
{
  "topics": [
    {"name": "orders", "subscribers": 0},
    {"name": "notifications", "subscribers": 2}
  ]
}
```

---

### DELETE /api/topics/[name] - Delete Topic

Delete a topic. Fails if topic has active subscribers.

**Request (Local):**
```bash
curl -X DELETE http://localhost:3000/api/topics/orders
```

**Request (Production):**
```bash
curl -X DELETE https://pubsub-system-final.vercel.app/api/topics/orders
```

**Response (200 OK):**
```json
{
  "status": "deleted",
  "topic": "orders"
}
```

**Response (404 Not Found):**
```json
{
  "status": "not_found",
  "topic": "orders"
}
```

**Response (409 Conflict - has subscribers):**
```json
{
  "status": "has_subscribers",
  "topic": "orders",
  "subscribers": 3,
  "message": "Cannot delete topic with active subscribers. Unsubscribe all clients first."
}
```

**Pusher Event:** Emits `topic_deleted` on `control-topics` channel

---

### POST /api/publish - Publish Message

Publish a message to a topic. Message is stored in memory and broadcasted via Pusher.

**Request (with message ID - Local):**
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

**Request (with message ID - Production):**
```bash
curl -X POST https://pubsub-system-final.vercel.app/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "id": "msg-001",
      "payload": {"order": "Order #1", "amount": 100}
    }
  }'
```

**Request (auto-generate ID - Local):**
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

**Request (auto-generate ID - Production):**
```bash
curl -X POST https://pubsub-system-final.vercel.app/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "message": {
      "payload": {"order": "Order #2", "amount": 200}
    }
  }'
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "topic": "orders",
  "message_id": "msg-001",
  "broadcast": true
}
```

**Response (404 Not Found - topic doesn't exist):**
```json
{
  "error": "Topic not found",
  "code": "TOPIC_NOT_FOUND",
  "message": "Topic 'orders' does not exist. Create it first using POST /api/topics",
  "topic": "orders"
}
```

**Pusher Event:** Emits `event-message` on `topic-<topicName>` channel with payload:
```json
{
  "id": "msg-001",
  "payload": {"order": "Order #1", "amount": 100},
  "ts": "2025-11-07T12:34:56.789Z"
}
```

---

### GET /api/health - Health Check

Server health and statistics.

**Request (Local):**
```bash
curl http://localhost:3000/api/health
```

**Request (Production):**
```bash
curl https://pubsub-system-final.vercel.app/api/health
```

**Response (200 OK):**
```json
{
  "uptime_sec": 123.456,
  "topics": 5,
  "subscribers": 12
}
```

---

### GET /api/stats - Statistics

Detailed statistics for all topics.

**Request (Local):**
```bash
curl http://localhost:3000/api/stats
```

**Request (Production):**
```bash
curl https://pubsub-system-final.vercel.app/api/stats
```

**Response (200 OK):**
```json
{
  "topics": {
    "orders": {
      "messages": 42,
      "subscribers": 3,
      "bufferSize": 42,
      "bufferCapacity": 100
    },
    "notifications": {
      "messages": 15,
      "subscribers": 5,
      "bufferSize": 15,
      "bufferCapacity": 100
    }
  }
}
```

---

### GET /api/history - Message History

Retrieve last N messages from a topic's ring buffer.

**Request (Local):**
```bash
# Get last 5 messages
curl "http://localhost:3000/api/history?topic=orders&last_n=5"

# Get last 10 messages (default)
curl "http://localhost:3000/api/history?topic=orders"
```

**Request (Production):**
```bash
# Get last 5 messages
curl "https://pubsub-system-final.vercel.app/api/history?topic=orders&last_n=5"

# Get last 10 messages (default)
curl "https://pubsub-system-final.vercel.app/api/history?topic=orders"
```

**Response (200 OK):**
```json
{
  "topic": "orders",
  "messages": [
    {
      "id": "msg-001",
      "payload": {"order": "Order #1", "amount": 100},
      "timestamp": "2025-11-07T12:34:56.789Z"
    },
    {
      "id": "msg-002",
      "payload": {"order": "Order #2", "amount": 200},
      "timestamp": "2025-11-07T12:35:01.123Z"
    }
  ],
  "count": 2,
  "requested": 5
}
```

**Query Parameters:**
- `topic` (required) - Topic name
- `last_n` (optional) - Number of messages to retrieve (default: 10, max: 100)

---

## Running with Docker

### Build Docker Image

```bash
# Build the image
docker build -t pubsub-app .

# Verify image was created
docker images | grep pubsub-app
```

### Run Container

```bash
# Run container
docker run -d \
  -p 3000:3000 \
  --name pubsub \
  pubsub-app

# Check logs
docker logs -f pubsub

# Stop container
docker stop pubsub

# Remove container
docker rm pubsub
```

**Note:** Pusher credentials are hardcoded in the application, so no environment variables are needed.

### Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  pubsub:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
docker-compose logs -f
docker-compose down
```

---

## Vercel Deployment

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy from CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Step 3: Deploy from GitHub (Recommended)

1. Push code to GitHub repository
2. Import project in Vercel Dashboard
3. Select the repository
4. Deploy

Vercel will automatically:
- Install dependencies
- Build the Next.js application
- Deploy API routes as serverless functions
- Set up automatic deployments on git push

**Note:** Pusher credentials are hardcoded, so no environment variable configuration is needed.

### Step 4: Verify Deployment

Visit your deployment URL (e.g., `https://your-app.vercel.app`) and test:

1. Frontend loads correctly
2. Pusher connection status shows "Connected"
3. Can create topics
4. Can publish messages
5. Real-time updates work

### Troubleshooting Vercel Deployment

**Issue: Real-time not working**
- Check Pusher Dashboard for connection errors
- Verify CORS settings in Pusher (should allow your Vercel domain)
- Check browser console for WebSocket errors

**Issue: Topics not syncing between users**
- This is expected in Vercel serverless!
- Each function instance has isolated memory
- For production, use external storage (Redis, PostgreSQL)
- See "Assumptions" section below

---

## Backpressure & Replay Policy

### Backpressure Handling

**Pusher-Delegated:**
- This system delegates backpressure handling to Pusher
- Pusher manages per-subscriber queues and delivery guarantees
- Server publishes messages to Pusher without waiting for delivery confirmation
- If a subscriber is slow, Pusher handles buffering and reconnection

**Server-Side Limits:**
- In-memory ring buffer capped at 100 messages per topic
- Oldest messages dropped when buffer is full (FIFO)
- Message history API limited to max 100 messages per request
- No persistent storage = no unbounded memory growth

**Design Decision:**
We rely on Pusher for delivery guarantees rather than implementing custom queuing. This provides:
- Automatic reconnection for disconnected clients
- Message ordering guarantees per channel
- Presence detection for subscribers
- Scalability without custom infrastructure

### Replay Policy

**Ring Buffer Replay:**
- Each topic maintains last 100 messages in memory
- New subscribers can retrieve history via `/api/history`
- Default: last 10 messages
- Maximum: 100 messages

**Replay Behavior:**
```bash
# When subscribing to a topic:
1. Frontend calls GET /api/history?topic=orders&last_n=10
2. Displays historical messages with "History" badge
3. Subscribes to Pusher channel topic-orders
4. New messages appear in real-time

# Ring buffer overflow:
1. Messages 1-100 stored in buffer
2. Message 101 published → Message 1 dropped
3. Message 102 published → Message 2 dropped
4. Buffer always contains last 100 messages
```

**Limitations:**
- Messages older than buffer size are lost
- No persistent storage (intentional for demo)
- Buffer resets on server restart
- In Vercel, each instance has its own buffer

**Production Recommendations:**
- Use Redis Lists for message history
- Store in PostgreSQL for persistence
- Use Pusher's message history feature (if enabled)
- Implement custom replay logic with external storage

---

## Assumptions & Limitations

### Design Assumptions

1. **In-Memory Storage Acceptable**
   - Topics, messages, and statistics stored in memory only
   - Acceptable for demo, testing, and development
   - Data lost on server restart (intentional)

2. **Single Process Deployment**
   - Works perfectly on single VM, container, or local dev server
   - In-memory state shared within one Node.js process

3. **Pusher Handles Distribution**
   - Real-time message delivery delegated to Pusher
   - No custom WebSocket implementation
   - Relies on Pusher's infrastructure for scaling

4. **Bounded Message History**
   - Ring buffer limited to 100 messages per topic
   - Prevents unbounded memory growth
   - Oldest messages automatically dropped

5. **No Authentication**
   - Demo system with no auth/authorization
   - Anyone can create/delete topics
   - Anyone can publish messages
   - Production would need auth middleware

### Known Limitations

1. **Vercel Serverless Isolation**
   - Each serverless function has isolated memory
   - Topics created in one instance not visible in others
   - Workaround: Use external storage (Redis, PostgreSQL)
   - Control events still work via Pusher

2. **No Persistent Storage**
   - All data lost on restart
   - No database, no file storage
   - Acceptable for demo, not for production

3. **No Rate Limiting**
   - Unlimited topic creation
   - Unlimited message publishing
   - Production needs rate limiting middleware

4. **No Message Ordering Guarantees Across Topics**
   - Per-topic ordering guaranteed by Pusher
   - Cross-topic ordering not guaranteed
   - Acceptable for most pub/sub use cases

5. **Limited Error Recovery**
   - If Pusher publish fails, message still stored locally
   - No retry logic for failed Pusher publishes
   - Logged but not retried

6. **No Schema Validation**
   - Message payloads not validated
   - Any JSON accepted
   - Production needs schema validation (e.g., JSON Schema, Zod)

### Production Migration Path

To make this production-ready:

**1. Add Persistent Storage**
```javascript
// Replace in-memory Map with Redis
const redis = new Redis(process.env.REDIS_URL);

// Store topics
await redis.sadd('topics', topicName);

// Store messages in Redis List
await redis.lpush(`topic:${topicName}:messages`, JSON.stringify(message));
await redis.ltrim(`topic:${topicName}:messages`, 0, 99); // Keep last 100
```

**2. Add Authentication**
```javascript
// Middleware for API routes
import { requireAuth } from '@/middleware/auth';

export default requireAuth(async function handler(req, res) {
  // ... protected endpoint logic
});
```

**3. Add Rate Limiting**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per minute
});
```

**4. Add Schema Validation**
```javascript
import { z } from 'zod';

const MessageSchema = z.object({
  topic: z.string().min(1).max(100),
  message: z.object({
    id: z.string().uuid().optional(),
    payload: z.any()
  })
});

// Validate before processing
const validated = MessageSchema.parse(req.body);
```

**5. Add Monitoring**
```javascript
// Integrate with Sentry, DataDog, or similar
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error);
```

---

## Testing

### Automated Tests

```bash
# Test topics manager
node testTopicsManager.js

# Test Pusher wrapper
node testPusherServer.js

# Test UUID helper
node testUuidHelper.js

# Test API endpoints
./testApiTopics.sh          # Create/list topics
./testApiDelete.sh          # Delete topics
./testApiPublish.sh         # Publish messages
./testApiHealthStats.sh     # Health/stats endpoints
./testApiHistory.sh         # Message history
```

### Manual Testing

1. **Start server:** `npm run dev`
2. **Open browser:** http://localhost:3000
3. **Open DevTools:** F12 → Console
4. **Test features:**
   - Create topics
   - Publish messages
   - Delete topics
   - Open multiple tabs (test real-time sync)

### Test with Pusher Dashboard

1. Go to https://dashboard.pusher.com/
2. Select your app
3. Open "Debug Console"
4. Create topics and publish messages
5. See events appear in real-time

---

## Documentation

- **QUICK_START.md** - 5-minute setup guide
- **FRONTEND_TESTING.md** - Comprehensive UI testing scenarios
- **GRACEFUL_SHUTDOWN.md** - Production deployment guide
- **TEST_*.md** - API endpoint testing guides
- **API_FLOW.md** - Request/response flow diagrams

---

## Tech Stack

- **Frontend:** Next.js, React, Pusher-js
- **Backend:** Next.js API Routes (Node.js)
- **Real-time:** Pusher Channels (WebSocket)
- **Storage:** In-memory (Map, Array)
- **Deployment:** Vercel, Docker

---

## License

MIT License - feel free to use for learning, demos, or as a starting point for production systems.

---

## Support

For issues or questions:
1. Check the documentation files (*.md)
2. Check Pusher Dashboard for connection issues
3. Check browser console for errors
4. Check server logs for API errors

---

**Built as a demonstration of real-time pub/sub architecture with Next.js and Pusher.**
