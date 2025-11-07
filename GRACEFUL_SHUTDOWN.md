# Graceful Shutdown Documentation

## Overview

This document explains the graceful shutdown behavior for different deployment scenarios.

---

## Local Development & Docker Deployment

### Using the Graceful Shutdown Server

For local Docker deployments or production servers, use the `server.js` script:

```bash
# Build the application first
npm run build

# Start with graceful shutdown
npm run start:graceful

# Or directly
node server.js
```

### What Happens on Shutdown

When you press **Ctrl+C** or the process receives **SIGTERM/SIGINT**:

1. **Signal Detected**
   - Server recognizes shutdown request
   - Logs shutdown initiation

2. **Graceful Stop Attempt**
   - Sends SIGTERM to Next.js process
   - Waits 2 seconds for clean shutdown
   - Allows in-flight requests to complete

3. **Force Kill (if needed)**
   - If process doesn't stop after 2 seconds
   - Sends SIGKILL to force termination

4. **Cleanup & Logging**
   - Logs final state
   - Warns about data loss
   - Exits with code 0

### Example Output

```bash
$ node server.js
=== Next.js PubSub Server ===
Environment: production
Port: 3000

Starting Next.js server...
✓ Server started
✓ Listening on http://localhost:3000

Press Ctrl+C to stop

^C
Received SIGINT - initiating graceful shutdown...

📊 Shutdown status:
  • Stopping server...
  • Sending SIGTERM to Next.js process...
  • Server stopped

⚠️  Note: In-memory data (topics, messages) has been lost
   For persistent data, use external storage (Redis, Database)

✓ Graceful shutdown complete
```

---

## Vercel Serverless Deployment

### How Vercel Functions Work

On Vercel, Next.js API routes run as **serverless functions**:

1. **Cold Start**
   - Function instance is created on first request
   - Module-level code runs once
   - In-memory state is initialized

2. **Warm Execution**
   - Subsequent requests reuse the same instance
   - In-memory state persists within the instance
   - No shared state between instances

3. **Function Lifecycle**
   - Vercel manages the function lifecycle automatically
   - Functions may be killed after inactivity
   - No explicit shutdown hook available

### Limitations on Vercel

❌ **No Custom Shutdown Handler**
- Vercel doesn't support custom shutdown scripts
- `server.js` is not used on Vercel
- Functions are terminated by Vercel's infrastructure

❌ **No Shared State**
- Each function instance has isolated memory
- Topics created in one instance aren't visible to others
- No coordination between instances

❌ **No Persistent In-Memory Data**
- Data may be lost when function instance is killed
- No guarantee of lifecycle duration
- Cold starts reset all in-memory state

### Vercel Best Practices

✅ **Use External Storage**
```javascript
// Instead of in-memory topicsManager, use:
- Redis for topics and message buffers
- PostgreSQL for persistent topic registry
- Pusher Channels API for pub/sub state
```

✅ **Stateless Design**
- Don't rely on in-memory data persisting
- Use external services for coordination
- Design for distributed systems

✅ **Environment Variables**
```bash
# Set in Vercel Dashboard → Project Settings → Environment Variables
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

---

## In-Memory State Limitations

### What Gets Lost on Shutdown

🗑️ **Topics**
- All created topics
- Topic metadata (subscribers, message counts)

🗑️ **Messages**
- Ring buffer contents (last 100 messages per topic)
- Message history for replay

🗑️ **Statistics**
- Message counts
- Subscriber counts
- Uptime (resets to 0)

### What Persists

✅ **Pusher Events**
- Already broadcasted messages reach subscribers
- Pusher maintains its own message history (if enabled)

✅ **Environment Configuration**
- Pusher credentials
- Port settings
- Node environment

---

## Production Recommendations

### For Docker/VM Deployments

**Use the graceful shutdown server:**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

# Use graceful shutdown server
CMD ["node", "server.js"]
```

**Handle signals properly:**
- Docker sends SIGTERM on `docker stop`
- Kubernetes sends SIGTERM before pod termination
- Our `server.js` handles both SIGTERM and SIGINT

### For Serverless (Vercel/AWS Lambda)

**Use external storage:**

1. **Redis for Topics**
   ```javascript
   // Store topics in Redis instead of Map
   const redis = new Redis(process.env.REDIS_URL);
   await redis.sadd('topics', topicName);
   ```

2. **Redis for Messages**
   ```javascript
   // Store message history in Redis lists
   await redis.lpush(`topic:${topicName}:messages`, JSON.stringify(message));
   await redis.ltrim(`topic:${topicName}:messages`, 0, 99); // Keep last 100
   ```

3. **Pusher for Pub/Sub**
   ```javascript
   // Let Pusher handle the pub/sub entirely
   // No in-memory message storage needed
   await pusher.trigger(channel, event, data);
   ```

---

## Testing Graceful Shutdown

### Test Locally

```bash
# Terminal 1: Start server
npm run start:graceful

# Terminal 2: Make some requests
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

curl http://localhost:3000/api/topics

# Terminal 1: Press Ctrl+C
# Observe graceful shutdown messages
```

### Test in Docker

```bash
# Build image
docker build -t pubsub-app .

# Run container
docker run -p 3000:3000 --name pubsub pubsub-app

# In another terminal, stop gracefully
docker stop pubsub

# Check logs
docker logs pubsub
```

### Expected Behavior

✅ **Clean Shutdown**
- Server logs "initiating graceful shutdown"
- Next.js process receives SIGTERM
- Server stops within 2 seconds
- Exit code is 0

✅ **In-Flight Requests**
- Requests in progress complete
- New requests are rejected
- No connection errors for active clients

---

## Signal Handling Summary

| Signal | Source | Behavior |
|--------|--------|----------|
| SIGTERM | Docker stop, Kubernetes | Graceful shutdown (2s timeout) |
| SIGINT | Ctrl+C, Terminal interrupt | Graceful shutdown (2s timeout) |
| SIGKILL | Force kill, timeout | Immediate termination (no cleanup) |

---

## Comparison: Local vs Serverless

| Feature | Local/Docker | Vercel Serverless |
|---------|--------------|-------------------|
| Graceful Shutdown | ✅ Supported via `server.js` | ❌ Managed by platform |
| In-Memory State | ✅ Persists during runtime | ⚠️ Per-instance only |
| Shared State | ✅ Single instance | ❌ Isolated instances |
| Custom Handlers | ✅ SIGTERM/SIGINT | ❌ Not available |
| Recommended Storage | Can use in-memory | Must use external |
| Uptime Tracking | ✅ Accurate | ⚠️ Per-function instance |

---

## Environment-Specific Configuration

### Development
```bash
npm run dev
# No graceful shutdown needed (development server)
```

### Production (Docker)
```bash
npm run build
node server.js
# Graceful shutdown enabled
```

### Production (Vercel)
```bash
vercel --prod
# Graceful shutdown handled by Vercel
# Use external storage for state
```

---

## Conclusion

- **Local/Docker**: Use `server.js` for graceful shutdown
- **Vercel**: Rely on platform lifecycle, use external storage
- **In-Memory**: Acceptable for demo, not for production
- **Best Practice**: External storage (Redis) for distributed systems

The graceful shutdown implementation is production-ready for containerized deployments and well-documented for serverless limitations! 🚀

