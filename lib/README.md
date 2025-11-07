# Backend Core Libraries

Core backend modules for the PubSub application.

## Topics Manager

In-memory topic management system.

## Usage Example

```javascript
const {
  createTopic,
  addMessage,
  getHistory,
  incrementSubscriber,
  getStats
} = require('./topicsManager');

// Create a topic
const result = createTopic('orders');
if (result.success) {
  console.log('Topic created:', result.topic.name);
}

// Add messages
addMessage('orders', {
  id: 'order-123',
  payload: { product: 'Widget', quantity: 5 }
});

// Get message history
const history = getHistory('orders', 10); // Last 10 messages
console.log('Recent messages:', history.messages);

// Track subscribers
incrementSubscriber('orders');

// Get statistics
const stats = getStats();
console.log('Stats:', stats);
```

## Return Format

All functions return objects with a consistent format:

```javascript
{
  success: boolean,
  // Additional fields on success
  topic?: Object,
  messages?: Array,
  count?: number,
  // Error field on failure
  error?: string
}
```

## Topic Object Structure

```javascript
{
  name: string,
  subscribers: number,
  messageCount: number,
  ringBuffer: Array,
  bufferSize: number,
  createdAt: string (ISO 8601)
}
```

## Concurrency & Serverless Notes

- **Node.js Event Loop**: Single-threaded, operations are atomic within a process
- **Serverless Limitation**: Each function instance has isolated memory
- **Production Use**: Consider Redis or DynamoDB for shared state across instances
- **Current Scope**: Suitable for demo, single-instance, or development environments

---

## Pusher Server Wrapper

Wrapper around Pusher server SDK for triggering real-time events to clients.

### Usage Example

```javascript
const { triggerMessage, validatePusherConfig } = require('./pusherServer');

// Always validate config first
if (!validatePusherConfig()) {
  throw new Error('Pusher not configured');
}

// Trigger a message to a topic
const result = await triggerMessage('orders', {
  id: 'msg-123',
  payload: { 
    order: 'Order #1',
    amount: 100
  }
});

if (result.success) {
  console.log('Message sent!');
}
```

### Channel Naming Convention

- Topics map to Pusher channels: `topic-<topicName>`
- Example: Topic "orders" → Channel "topic-orders"
- All messages use event name: `event-message`

### Message Format

Messages are automatically formatted with timestamp:

```javascript
{
  id: "msg-123",           // From your input
  payload: { ... },        // From your input
  ts: "2025-11-07T05:30:17.116Z"  // Auto-added ISO timestamp
}
```

### Environment Variables Required

- `PUSHER_APP_ID` - Your Pusher application ID
- `PUSHER_KEY` - Your Pusher key
- `PUSHER_SECRET` - Your Pusher secret (server-side only)
- `PUSHER_CLUSTER` - Your Pusher cluster (e.g., 'us2', 'eu')

### Functions

- **`validatePusherConfig()`** → boolean - Check if all env vars are set
- **`triggerMessage(topic, message)`** → Promise\<{success, error?}\> - Send one message
- **`triggerBatch(items)`** → Promise\<{success, results}\> - Send multiple messages
- **`getPusherClient()`** → Pusher|null - Get initialized client instance

### Error Handling

The wrapper handles errors gracefully and returns structured responses:

```javascript
// Success
{ success: true }

// Failure
{ success: false, error: "Description of what went wrong" }
```

### TLS/Security

- TLS is enabled by default (`useTLS: true`)
- All communication with Pusher is encrypted
- Server secret is never exposed to clients

