# Deployment Guide

Complete guide for deploying the PubSub system to various environments.

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Pusher credentials

# Start development server
npm run dev
```

Visit http://localhost:3000

### Development Scripts

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run start:graceful   # Start with graceful shutdown
npm run lint             # Run ESLint
```

---

## Docker Deployment

### Prerequisites

- Docker installed and running
- Pusher credentials (get from https://pusher.com/)

### Option 1: Quick Build & Run

```bash
# Build and run in one command
./docker-build.sh run

# Or build and test
./docker-build.sh test
```

### Option 2: Manual Build & Run

```bash
# Build image
docker build -t pubsub-app .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e PUSHER_APP_ID=your_app_id \
  -e PUSHER_KEY=your_key \
  -e PUSHER_SECRET=your_secret \
  -e PUSHER_CLUSTER=your_cluster \
  -e NEXT_PUBLIC_PUSHER_KEY=your_key \
  -e NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster \
  --name pubsub \
  pubsub-app

# View logs
docker logs -f pubsub

# Stop and remove
docker stop pubsub && docker rm pubsub
```

### Option 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  pubsub:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    restart: unless-stopped
```

Run:

```bash
docker-compose up -d       # Start
docker-compose logs -f     # View logs
docker-compose down        # Stop
```

### Docker Production Tips

1. **Use Multi-Stage Build** (already configured in Dockerfile)
2. **Set Resource Limits:**
   ```bash
   docker run -d \
     --memory="512m" \
     --cpus="0.5" \
     -p 3000:3000 \
     pubsub-app
   ```

3. **Health Checks:**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

4. **Persistent Logs:**
   ```bash
   docker run -d \
     -v $(pwd)/logs:/app/logs \
     pubsub-app
   ```

---

## Vercel Deployment

Vercel is the recommended platform for this Next.js application.

### Method 1: Deploy from CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Method 2: Deploy from GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/pubsub-app.git
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables:**
   - Go to Settings → Environment Variables
   - Add all required variables (see below)
   - Redeploy if already deployed

4. **Automatic Deployments:**
   - Push to `main` branch → production deployment
   - Push to other branches → preview deployment
   - Pull requests get preview URLs automatically

### Vercel Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `PUSHER_APP_ID` | your_app_id | Server-side |
| `PUSHER_KEY` | your_key | Server-side |
| `PUSHER_SECRET` | your_secret | Server-side (keep secret!) |
| `PUSHER_CLUSTER` | your_cluster | Server-side |
| `NEXT_PUBLIC_PUSHER_KEY` | your_key | Client-side (exposed) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | your_cluster | Client-side (exposed) |

**Important:**
- Set for all environments: Production, Preview, Development
- `PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_KEY` should have the same value
- After adding variables, redeploy or push new commit

### Vercel Configuration

The `vercel.json` file is included with optimal settings:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

**Regions:**
- `iad1` - US East (default)
- `sfo1` - US West
- `lhr1` - Europe (London)
- Choose region closest to your users

### Vercel-Specific Considerations

**1. Serverless Functions**
- Each API route is a separate serverless function
- Cold starts: ~1-2 seconds for first request
- Warm starts: ~10-50ms

**2. In-Memory State**
- Each function instance has isolated memory
- Topics created in one instance aren't visible in others
- Use external storage (Redis) for shared state

**3. Function Limits**
- Max execution time: 10s (Hobby), 60s (Pro)
- Max payload: 5MB
- Max response: 5MB

**4. WebSocket Support**
- Vercel doesn't support persistent WebSocket connections
- Use Pusher (already implemented) for real-time

---

## Environment Variables

### Required Variables

```bash
# Server-side (Next.js API routes)
PUSHER_APP_ID=1234567
PUSHER_KEY=abc123def456
PUSHER_SECRET=xyz789uvw012  # Never expose to client!
PUSHER_CLUSTER=us2

# Client-side (Frontend, embedded in bundle)
NEXT_PUBLIC_PUSHER_KEY=abc123def456  # Same as PUSHER_KEY
NEXT_PUBLIC_PUSHER_CLUSTER=us2        # Same as PUSHER_CLUSTER
```

### Getting Pusher Credentials

1. Go to https://pusher.com/
2. Sign up or log in
3. Create a new app (free tier available)
4. Go to "App Keys" tab
5. Copy the credentials

### Security Notes

- `PUSHER_SECRET` is server-only, never exposed to browser
- `NEXT_PUBLIC_*` variables are embedded in frontend bundle
- Anyone can see `NEXT_PUBLIC_*` values in browser DevTools
- This is normal and expected for Pusher public key

---

## Troubleshooting

### Issue: "Pusher credentials not configured"

**Symptoms:**
- Red error banner in UI
- Status shows "Disconnected"
- Console error about missing credentials

**Solutions:**
1. **Local:** Check `.env.local` exists and has correct values
2. **Docker:** Pass environment variables with `-e` or `--env-file`
3. **Vercel:** Check environment variables in dashboard
4. **All:** Restart/redeploy after adding variables

### Issue: Real-time not working

**Symptoms:**
- Topics don't sync between tabs
- Messages don't appear in real-time
- Control events not received

**Solutions:**
1. Check Pusher connection status (should be green "Connected")
2. Verify credentials are correct
3. Check Pusher Dashboard → Debug Console for events
4. Check browser console for WebSocket errors
5. Verify CORS settings in Pusher allow your domain

### Issue: Topics not syncing on Vercel

**Symptoms:**
- Create topic in one tab, doesn't appear in another
- Different users see different topic lists

**This is expected!**
- Vercel functions have isolated memory
- Topics stored in memory aren't shared
- Control events (via Pusher) should still work
- For production, use external storage (Redis, PostgreSQL)

### Issue: Docker build fails

**Symptoms:**
- `docker build` command errors
- Missing dependencies
- Build hangs

**Solutions:**
```bash
# Clear Docker cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t pubsub-app .

# Check Docker has enough resources
# Settings → Resources → increase memory/CPU
```

### Issue: Port already in use

**Symptoms:**
- `EADDRINUSE: address already in use :::3000`
- Docker run fails with port error

**Solutions:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port
docker run -p 3001:3000 pubsub-app
```

### Issue: Cannot connect to container

**Symptoms:**
- Container running but can't access localhost:3000
- curl fails with connection refused

**Solutions:**
```bash
# Check container is running
docker ps

# Check container logs
docker logs pubsub

# Check port mapping
docker port pubsub

# Try accessing from container network
docker exec pubsub curl localhost:3000/api/health
```

---

## Monitoring & Logs

### Local Development

```bash
# Console output shows logs
npm run dev
```

### Docker

```bash
# Real-time logs
docker logs -f pubsub

# Last 100 lines
docker logs --tail 100 pubsub

# Logs since timestamp
docker logs --since 2025-01-01T00:00:00 pubsub
```

### Vercel

1. Go to Vercel Dashboard → Your Project
2. Click on a deployment
3. Click "Functions" tab
4. View logs for each function
5. Or use Vercel CLI:
   ```bash
   vercel logs
   vercel logs --follow  # Real-time
   ```

---

## Performance & Scaling

### Local/Docker

- Single process handles all requests
- In-memory state shared across requests
- Limited by server resources
- Suitable for: Dev, testing, small deployments

### Vercel

- Auto-scales based on traffic
- Each function instance isolated
- In-memory state NOT shared
- Suitable for: Production, high traffic

**Scaling Strategy:**
1. Start with Vercel for simplicity
2. Add Redis for shared state if needed
3. Monitor metrics in Vercel dashboard
4. Upgrade plan if hitting limits

---

## Next Steps After Deployment

1. ✅ Verify deployment works
2. ✅ Test all API endpoints
3. ✅ Test real-time features
4. ✅ Open multiple tabs/devices
5. ✅ Check Pusher Dashboard for events
6. 🔄 Set up monitoring (Sentry, DataDog)
7. 🔄 Add custom domain (Vercel settings)
8. 🔄 Set up CI/CD if not using GitHub integration
9. 🔄 Implement external storage for production
10. 🔄 Add authentication if needed

---

## Support

- **Documentation:** See *.md files in project root
- **Pusher Issues:** https://support.pusher.com/
- **Vercel Issues:** https://vercel.com/support
- **Docker Issues:** https://docs.docker.com/

---

**Successfully deployed? Test the system and enjoy your real-time PubSub platform! 🚀**

