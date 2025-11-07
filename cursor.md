# cursor.md — Cursor instructions for `nextjs-pubsub-pusher`

## Summary
This repository is a Next.js monorepo that implements:
- Frontend UI (React / Next.js) for topic management and publishing.
- Backend API routes (`/api/*`) for topic management, stats, and publishing.
- Realtime delivery via **Pusher** (server SDK in API routes; client SDK in frontend).
- In-memory topic state and optional message replay buffer (`last_n`).

## Primary goals
1. Implement REST API endpoints per assignment contract.
2. Implement Pusher publish from backend and Pusher client subscription in frontend.
3. Provide UI for create/list/delete topics and publish messages.
4. Provide README with local run instructions, Vercel deploy steps, env vars, and sample curl/JS snippets.

## Environment variables (Vercel & local)
- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`
- (Optional) `API_KEY` for admin endpoints
- For local dev, place them in `.env.local`.

## API endpoints
- POST `/api/topics` — create topic
- DELETE `/api/topics/[name]` — delete topic
- GET `/api/topics` — list topics
- GET `/api/health` — uptime, topics, subscribers
- GET `/api/stats` — messages/subscribers per topic
- POST `/api/publish` — publish message (helper)
- GET `/api/history?topic=orders&last_n=5` — optional history replay

## Pusher integration
- Topics map to channels: `topic-${topicName}`
- Events: `event-message` with payload `{ id, payload, ts }`
- Server: use Pusher server SDK in API routes to trigger events.
- Client: use `@pusher/push-notifications-web` or `pusher-js` to subscribe and receive events.

## How to test locally (quick)
1. `git clone ...`
2. `cd nextjs-pubsub-pusher`
3. `npm install`
4. Create `.env.local` with Pusher creds
5. `npm run dev` (Next.js dev server)
6. Use the UI at `http://localhost:3000` to create topic / publish
7. Use curl: `curl -X POST http://localhost:3000/api/topics -H "Content-Type: application/json" -d '{"name":"orders"}'`

## Vercel deployment steps
1. Create a new project in Vercel linked to GitHub repo
2. Add env vars in Vercel Dashboard (same names as `.env.local`)
3. Set framework to Next.js (Vercel usually does this automatically)
4. Deploy — API routes run as serverless functions and frontend is served.

## Design notes / assumptions
- All state is in memory. No persistence across restarts.
- Message replay buffer is bounded (default 100 messages). Oldest messages dropped on overflow.
- Rely on Pusher for fan-out and delivery; in-memory data is for management and replay only.
- Security: API key optional and configurable.

## Deliverables
- Working Next.js app
- README with examples
- Dockerfile (local usage)
- Clear commit history
