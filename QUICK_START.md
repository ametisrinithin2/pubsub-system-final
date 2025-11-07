# Quick Start Guide

Get the PubSub System running in 5 minutes!

## 1. Install Dependencies

```bash
cd /Users/ametisrinithin/Desktop/p_assignment
npm install
```

## 2. Configure Pusher

Get free Pusher credentials at https://pusher.com/

Create `.env.local`:

```bash
# Server-side (keep secret)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

# Client-side (safe to expose)
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

**Important:** Use the SAME key for both `PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_KEY`!

## 3. Start Development Server

```bash
npm run dev
```

Wait for:
```
✓ Ready in 2.3s
```

## 4. Open in Browser

Visit: http://localhost:3000

You should see:
- **Header:** "PubSub System"
- **Status:** "● Connected" (green) after 1-2 seconds
- **Left Column:** Create Topic form and empty topic list
- **Right Column:** Publish Message form (disabled until topic selected)

## 5. Test Basic Functionality

### Create a Topic

1. In "Create Topic" section, type: `orders`
2. Click "Create"
3. **Expected:** Topic appears in list below

### Publish a Message

1. Click on "orders" in the topic list (it highlights)
2. In "Publish Message", edit JSON:
   ```json
   {"order": "Order #1", "amount": 100}
   ```
3. Click "Publish to orders"
4. **Expected:** Message appears in "Live Messages" below

### Test Real-Time Sync

1. Open a NEW browser tab: http://localhost:3000
2. In the NEW tab, create a topic: `notifications`
3. **Expected:** In BOTH tabs, "notifications" appears immediately!

## 6. Test with curl (Backend)

In a terminal:

```bash
# Create topic
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"events"}'

# Publish message
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "events",
    "message": {
      "payload": {"test": "from curl"}
    }
  }'
```

**Expected:** In the browser, you'll see:
- "events" topic appear
- If "events" is selected, the message appears in real-time!

## Troubleshooting

### "Pusher credentials not configured"

- Check `.env.local` file exists
- Verify variables are set correctly
- Restart server: `Ctrl+C` then `npm run dev`
- Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### "Disconnected" status (red)

- Check internet connection
- Verify Pusher credentials are correct
- Check Pusher Dashboard → App Status

### Topics not syncing between tabs

- Verify BOTH tabs show "Connected"
- Check browser console (F12) for errors
- Verify environment variables are set
- Check Pusher Dashboard → Debug Console for events

## Success Indicators

✅ Status shows "● Connected" (green)  
✅ Can create topics  
✅ Can delete topics  
✅ Topics sync across tabs instantly  
✅ Can publish messages  
✅ Messages appear in real-time  
✅ Console logs show Pusher events  

## What's Working

You now have a fully functional pub/sub system with:

- **7 REST API endpoints** (topics, publish, health, stats, history)
- **Real-time messaging** via Pusher WebSockets
- **Topic management** with live UI updates
- **Message history** (last 10 messages per topic)
- **Multi-tab synchronization**
- **In-memory storage** (resets on server restart)

## Next Steps

- **Test** more features (see FRONTEND_TESTING.md)
- **Deploy** to Vercel (see README.md deployment section)
- **Customize** the UI (edit pages/index.js styles)
- **Add features** (persistence, authentication, etc.)

## Quick Command Reference

```bash
# Development
npm run dev                  # Start dev server

# Testing
./testApiTopics.sh          # Test topic APIs
./testApiPublish.sh         # Test publish API
./testApiDelete.sh          # Test delete API
./testApiHealthStats.sh     # Test health/stats
./testApiHistory.sh         # Test history API

# Production
npm run build               # Build for production
npm run start              # Start production (standard)
npm run start:graceful     # Start with graceful shutdown

# Testing Modules
node testTopicsManager.js   # Test in-memory manager
node testPusherServer.js    # Test Pusher wrapper
node testUuidHelper.js      # Test UUID generation
```

## Documentation

- **README.md** - Main documentation
- **FRONTEND_TESTING.md** - Comprehensive UI testing guide
- **GRACEFUL_SHUTDOWN.md** - Production deployment guide
- **TEST_*.md** - API endpoint testing guides

## Getting Help

1. Check browser console (F12) for errors
2. Check server terminal for logs
3. Check Pusher Dashboard → Debug Console
4. Read the relevant .md file for your issue

Happy PubSubbing! 🚀

