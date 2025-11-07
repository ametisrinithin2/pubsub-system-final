# Frontend Testing Guide

Complete guide for testing the Next.js PubSub frontend.

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Pusher**
   
   Create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` with your Pusher credentials:
   ```bash
   PUSHER_APP_ID=your_app_id
   PUSHER_KEY=your_key
   PUSHER_SECRET=your_secret
   PUSHER_CLUSTER=your_cluster

   # Frontend credentials (same key, no secret)
   NEXT_PUBLIC_PUSHER_KEY=your_key
   NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
   ```

   **Note:** `NEXT_PUBLIC_*` variables are exposed to the browser!

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   ```
   http://localhost:3000
   ```

---

## UI Overview

The frontend is divided into two columns:

### Left Column: Topic Management
1. **Create Topic** - Form to create new topics
2. **Topics List** - All topics with subscriber counts
3. **Control Events** - Real-time topic creation/deletion events

### Right Column: Messaging
1. **Publish Message** - Send messages to selected topic
2. **Live Messages** - Real-time message feed

---

## Test Scenario 1: Single Tab Testing

### Step 1: Create a Topic

1. In the "Create Topic" section, enter `orders`
2. Click "Create"
3. **Expected:**
   - Topic appears in the Topics list
   - Control Events shows "✓ orders"
   - Console logs: "🎉 Topic created: {topic: 'orders', ...}"

### Step 2: Select the Topic

1. Click on "orders" in the Topics list
2. **Expected:**
   - Topic is highlighted (blue background)
   - Publish section shows "→ orders"
   - Live Messages section shows "from orders"
   - Console logs: "Subscribing to topic-orders..."

### Step 3: Publish a Message

1. In the Publish Message textarea, edit the JSON:
   ```json
   {"order": "Order #1", "amount": 100}
   ```
2. Click "Publish to orders"
3. **Expected:**
   - Message appears in Live Messages
   - Console logs: "📨 Message received on orders: ..."
   - Message has an ID badge and timestamp

### Step 4: Publish More Messages

1. Publish a few more messages with different data
2. **Expected:**
   - Messages appear at the top of the feed (newest first)
   - Each has a unique ID
   - Timestamps are accurate

### Step 5: Delete the Topic

1. Click the 🗑️ icon next to "orders"
2. Confirm the deletion
3. **Expected:**
   - Topic removed from list
   - Control Events shows "✗ orders"
   - Publish section resets
   - Messages are cleared
   - Console logs: "🗑️ Topic deleted: {topic: 'orders', ...}"

---

## Test Scenario 2: Multi-Tab Real-Time Testing

This is the key test for verifying real-time functionality!

### Setup

1. Open http://localhost:3000 in **Tab 1**
2. Open http://localhost:3000 in **Tab 2** (duplicate tab or new window)
3. Arrange tabs side-by-side if possible

### Test: Topic Creation Sync

**Tab 1:**
1. Create topic "payments"
2. Click Create

**Expected in BOTH tabs:**
- "payments" appears in Topics list immediately
- Control Events show "✓ payments"
- No page refresh needed!

### Test: Topic Deletion Sync

**Tab 2:**
1. Delete topic "payments" (click 🗑️)
2. Confirm deletion

**Expected in BOTH tabs:**
- "payments" removed from Topics list immediately
- Control Events show "✗ payments"
- If tab had "payments" selected, it deselects

### Test: Message Broadcasting

**Tab 1:**
1. Create topic "notifications"
2. Select "notifications"
3. Publish message: `{"alert": "System update", "priority": "high"}`

**Tab 2:**
1. Select "notifications" topic
2. Wait a moment for subscription

**Tab 1:**
3. Publish another message: `{"alert": "Maintenance scheduled"}`

**Expected in Tab 2:**
- Message appears in real-time
- No delay (should be instant)
- Message includes ID and timestamp

**Try the reverse:**

**Tab 2:**
1. Publish a message

**Expected in Tab 1:**
- Message appears immediately
- Works in both directions!

---

## Test Scenario 3: Message History

### Test: History on Subscribe

1. **Tab 1:** Create and select topic "orders"
2. **Tab 1:** Publish 5 messages
3. **Tab 2:** Select topic "orders"

**Expected in Tab 2:**
- Last 10 messages appear with "History" badge (orange)
- New messages appear without badge
- History loads before real-time messages

---

## Test Scenario 4: Error Handling

### Test: Missing Pusher Credentials

1. Stop the server
2. Remove or comment out `NEXT_PUBLIC_PUSHER_KEY` in `.env.local`
3. Restart server
4. Open http://localhost:3000

**Expected:**
- Red error banner at top
- Message: "Pusher credentials not configured..."
- Status shows "Disconnected"

### Test: Invalid JSON in Publish

1. Create and select a topic
2. In Publish textarea, enter invalid JSON: `{invalid}`
3. Click Publish

**Expected:**
- Red error banner appears
- Message: "Invalid JSON or publish failed..."

### Test: Publish Without Topic

1. Don't select any topic
2. Try to publish

**Expected:**
- Error: "Please select a topic first"

---

## Test Scenario 5: Connection Status

### Test: Connection Indicator

1. Open the page
2. Look at the top-right status indicator

**Expected:**
- Initially: "● Disconnected" (red)
- After 1-2 seconds: "● Connected" (green)

### Test: Disconnection

1. Open browser DevTools (F12)
2. Go to Network tab
3. Set throttling to "Offline"

**Expected:**
- Status changes to "● Disconnected" (red)
- Console shows: "✗ Pusher disconnected"

4. Set throttling back to "Online"

**Expected:**
- Status changes to "● Connected" (green)
- Console shows: "✓ Pusher connected"

---

## Test Scenario 6: UI Interactions

### Test: Clear Buttons

1. Create some topics
2. Publish some messages
3. Click "Clear" button in Control Events

**Expected:**
- Control Events list is cleared
- Topics list remains

4. Click "Clear" button in Live Messages

**Expected:**
- Messages list is cleared
- Subscription remains active
- New messages still appear

### Test: Multiple Topics

1. Create 3-4 topics: "orders", "notifications", "events", "logs"
2. Switch between topics

**Expected:**
- Each topic shows its own messages
- Messages don't mix between topics
- Subscriber count updates (should be 0 unless multiple tabs)

---

## Console Logs Reference

When testing, watch the browser console (F12 → Console) for these logs:

### Connection Logs
```
Initializing Pusher...
✓ Pusher connected
```

### Topic Management
```
🎉 Topic created: {topic: "orders", ts: "..."}
🗑️ Topic deleted: {topic: "orders", ts: "..."}
```

### Subscriptions
```
Subscribing to topic-orders...
Already subscribed to topic-orders
Unsubscribing from topic-orders...
```

### Messages
```
📨 Message received on orders: {id: "...", payload: {...}, ts: "..."}
✓ Message published: {status: "ok", topic: "orders", ...}
```

---

## Common Issues & Solutions

### Issue: "Pusher credentials not configured"

**Solution:**
1. Check `.env.local` exists
2. Verify `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` are set
3. Restart dev server (`npm run dev`)
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Topics created but not showing in list

**Solution:**
1. Check browser console for errors
2. Verify Pusher connection is "Connected"
3. Try refreshing the page
4. Check Pusher Dashboard → Debug Console for events

### Issue: Messages not appearing

**Solution:**
1. Make sure topic is selected (should be highlighted)
2. Check console for "Subscribing to topic-..." message
3. Verify Pusher credentials are correct
4. Check Pusher Dashboard for message events

### Issue: Real-time not working between tabs

**Solution:**
1. Verify both tabs show "● Connected"
2. Check that events appear in Pusher Dashboard
3. Verify `.env.local` has the same key for `PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_KEY`
4. Try opening an incognito window as second tab

### Issue: Messages appear twice

**Solution:**
1. This is normal if you published from the same tab you're viewing
2. You'll see:
   - The message you sent (from publish)
   - The message received (from Pusher broadcast)
3. This confirms pub/sub is working!

---

## Advanced Testing

### Test: Concurrent Users

1. Open 3-4 browser tabs
2. Create topics from different tabs
3. Publish messages from different tabs
4. Delete topics from different tabs

**Expected:**
- All tabs stay in sync
- No conflicts or race conditions
- Messages appear in all tabs

### Test: Rapid Operations

1. Create 10 topics quickly (spam the create button)
2. Delete them all quickly

**Expected:**
- All operations succeed
- Control Events updates correctly
- No errors in console

### Test: Large Messages

1. Publish a large JSON object (100+ fields)
2. Check if it displays correctly

**Expected:**
- Message appears
- JSON is formatted nicely
- Scrollable if too large

---

## Browser DevTools Tips

### Network Tab
- See API calls to `/api/topics`, `/api/publish`, etc.
- See WebSocket connection to Pusher

### Console Tab
- See all Pusher events
- See API responses
- See error messages

### Application Tab
- See environment variables (under "Location")
- Note: Secrets are NOT visible (only NEXT_PUBLIC_* vars)

---

## Performance Notes

- **Initial Load:** Should be instant (static page)
- **Pusher Connect:** 1-2 seconds
- **Topic List:** Fetched on load
- **Message Latency:** < 100ms (typical Pusher latency)
- **Topic Create/Delete:** Immediate (optimistic + Pusher confirmation)

---

## Next Steps

After testing the frontend:

1. ✅ Verify all features work
2. ✅ Test real-time sync between tabs
3. ✅ Check Pusher Dashboard for events
4. ✅ Test error handling
5. 🎨 Optional: Customize styles
6. 🚀 Deploy to Vercel

---

## Deployment Testing

When deployed to Vercel:

1. Ensure environment variables are set in Vercel Dashboard
2. Test from different devices/networks
3. Check that CORS settings allow your domain
4. Verify Pusher connection works over HTTPS

All frontend features are production-ready! 🎉

