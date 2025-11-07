# Testing Pusher Control Events

This guide shows how to test the real-time topic management events.

## Prerequisites

1. **Pusher Configured**
   - Must have valid Pusher credentials in `.env.local`
   - Server must be running: `npm run dev`

2. **Pusher Dashboard Access**
   - Go to https://dashboard.pusher.com/
   - Select your app
   - Open "Debug Console"

---

## Testing Method 1: Pusher Dashboard

### Step 1: Open Pusher Debug Console

1. Visit https://dashboard.pusher.com/
2. Select your application
3. Click "Debug Console" in the left sidebar

### Step 2: Create a Topic

In your terminal:

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'
```

### Step 3: Check Pusher Debug Console

You should see:

- **Channel:** `control-topics`
- **Event:** `topic_created`
- **Data:**
  ```json
  {
    "topic": "orders",
    "ts": "2025-11-07T12:34:56.789Z"
  }
  ```

### Step 4: Delete the Topic

```bash
curl -X DELETE http://localhost:3000/api/topics/orders
```

### Step 5: Check Pusher Debug Console Again

You should see:

- **Channel:** `control-topics`
- **Event:** `topic_deleted`
- **Data:**
  ```json
  {
    "topic": "orders",
    "ts": "2025-11-07T12:35:01.123Z"
  }
  ```

---

## Testing Method 2: Browser Console

### Step 1: Include Pusher Client

Open http://localhost:3000 in your browser and open the console (F12).

Paste this code to include Pusher:

```javascript
// Load Pusher from CDN
const script = document.createElement('script');
script.src = 'https://js.pusher.com/8.2.0/pusher.min.js';
document.head.appendChild(script);

script.onload = () => {
  console.log('✓ Pusher loaded');
};
```

### Step 2: Connect and Subscribe

```javascript
// Initialize Pusher (replace with your credentials)
const pusher = new Pusher('YOUR_PUSHER_KEY', {
  cluster: 'YOUR_CLUSTER'
});

// Subscribe to control channel
const controlChannel = pusher.subscribe('control-topics');

// Listen for topic_created events
controlChannel.bind('topic_created', (data) => {
  console.log('🎉 Topic created:', data);
});

// Listen for topic_deleted events
controlChannel.bind('topic_deleted', (data) => {
  console.log('🗑️  Topic deleted:', data);
});

console.log('✓ Subscribed to control-topics');
```

### Step 3: Trigger Actions

In another terminal, create and delete topics:

```bash
# Create
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"test123"}'

# Delete
curl -X DELETE http://localhost:3000/api/topics/test123
```

### Step 4: Watch Console

You should see:

```
🎉 Topic created: {topic: 'test123', ts: '2025-11-07T12:34:56.789Z'}
🗑️  Topic deleted: {topic: 'test123', ts: '2025-11-07T12:35:01.123Z'}
```

---

## Testing Method 3: Server Logs

### Watch Server Output

When you run `npm run dev`, watch the terminal output:

**When creating a topic:**
```
✓ Emitted topic_created event for 'orders'
```

**When deleting a topic:**
```
✓ Emitted topic_deleted event for 'orders'
```

**If Pusher fails:**
```
⚠️  Failed to emit topic_created event for 'orders': <error message>
```

---

## Complete Test Script

Save this as a test file and run in browser console:

```javascript
// test-control-events.js

async function testControlEvents() {
  console.log('=== Testing Control Events ===\n');

  // Load Pusher
  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://js.pusher.com/8.2.0/pusher.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });

  // Initialize
  const pusher = new Pusher('YOUR_PUSHER_KEY', {
    cluster: 'YOUR_CLUSTER'
  });

  // Track events
  const events = [];

  // Subscribe
  const channel = pusher.subscribe('control-topics');

  channel.bind('topic_created', (data) => {
    console.log('✅ topic_created:', data);
    events.push({ type: 'created', data });
  });

  channel.bind('topic_deleted', (data) => {
    console.log('✅ topic_deleted:', data);
    events.push({ type: 'deleted', data });
  });

  console.log('✓ Subscribed to control-topics\n');
  console.log('Now run these curl commands in another terminal:\n');
  console.log('curl -X POST http://localhost:3000/api/topics -H "Content-Type: application/json" -d \'{"name":"test"}\'');
  console.log('curl -X DELETE http://localhost:3000/api/topics/test');
  console.log('\nEvents will appear above as they arrive.');

  // Return helper to check results
  return {
    getEvents: () => events,
    clear: () => events.length = 0
  };
}

// Run the test
testControlEvents();
```

---

## Expected Behavior

### Success Case

1. **Create Topic**
   - API returns 201 Created
   - Server logs: `✓ Emitted topic_created event`
   - Pusher Dashboard shows event
   - Browser console receives event

2. **Delete Topic**
   - API returns 200 OK
   - Server logs: `✓ Emitted topic_deleted event`
   - Pusher Dashboard shows event
   - Browser console receives event

### Without Pusher Configuration

If Pusher is not configured:

1. **Create/Delete Still Works**
   - API endpoints function normally
   - Topics are created/deleted
   - HTTP responses are correct

2. **No Events Emitted**
   - Server doesn't attempt to emit events
   - No errors in logs
   - Graceful degradation

### Error Case

If Pusher is configured but fails:

1. **Create/Delete Still Works**
   - API endpoints function normally
   - HTTP responses are correct

2. **Error Logged**
   - Server logs: `⚠️  Failed to emit ... event`
   - Error details included
   - Server continues running

---

## Event Payload Structure

### topic_created

```json
{
  "topic": "orders",         // Topic name
  "ts": "2025-11-07T12:34:56.789Z"  // ISO 8601 timestamp
}
```

### topic_deleted

```json
{
  "topic": "orders",         // Topic name
  "ts": "2025-11-07T12:35:01.123Z"  // ISO 8601 timestamp
}
```

---

## Frontend Integration Example

### React Component

```javascript
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export function TopicList() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    // Fetch initial topics
    fetch('/api/topics')
      .then(res => res.json())
      .then(data => setTopics(data.topics));

    // Subscribe to real-time updates
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });

    const channel = pusher.subscribe('control-topics');

    // Handle topic created
    channel.bind('topic_created', (data) => {
      setTopics(prev => [...prev, { name: data.topic, subscribers: 0 }]);
    });

    // Handle topic deleted
    channel.bind('topic_deleted', (data) => {
      setTopics(prev => prev.filter(t => t.name !== data.topic));
    });

    // Cleanup
    return () => {
      channel.unbind_all();
      pusher.unsubscribe('control-topics');
    };
  }, []);

  return (
    <ul>
      {topics.map(topic => (
        <li key={topic.name}>{topic.name}</li>
      ))}
    </ul>
  );
}
```

---

## Troubleshooting

### Events Not Appearing

1. **Check Pusher Credentials**
   ```bash
   # Verify .env.local has correct values
   cat .env.local
   ```

2. **Check Server Logs**
   - Should see: `✓ Emitted topic_created event`
   - If missing, Pusher not configured
   - If error, check credentials

3. **Check Pusher Dashboard**
   - Verify app is selected
   - Check Debug Console for events
   - Look for connection/auth errors

### Wrong Channel/Event Names

- Channel must be: `control-topics`
- Events must be: `topic_created` and `topic_deleted`
- Case-sensitive!

### CORS Issues

If testing from external domain:
- Pusher credentials must allow origin
- Check Pusher Dashboard → App Settings → CORS

---

## Non-Blocking Implementation

The implementation is non-blocking:

```javascript
// Fire and forget - doesn't block HTTP response
pusherClient.trigger('control-topics', 'topic_created', data)
  .catch(error => console.error('Failed:', error));

// HTTP response sent immediately
return res.status(201).json({ status: 'created' });
```

**Benefits:**
- Fast API responses
- Failures don't break topic creation
- Errors are logged but don't affect users

All control events are production-ready! 🚀

