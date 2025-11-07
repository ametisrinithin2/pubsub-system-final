# API Testing Instructions

## Prerequisites

Start the development server in one terminal:

```bash
npm run dev
```

Wait for the message: `✓ Ready in X.XXs`

## Manual Testing with curl

### 1. List Topics (Empty Initially)

```bash
curl http://localhost:3000/api/topics
```

Expected response (200 OK):
```json
{
  "topics": []
}
```

### 2. Create First Topic

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'
```

Expected response (201 Created):
```json
{
  "status": "created",
  "topic": "orders"
}
```

### 3. Create Second Topic

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"notifications"}'
```

Expected response (201 Created):
```json
{
  "status": "created",
  "topic": "notifications"
}
```

### 4. List All Topics

```bash
curl http://localhost:3000/api/topics
```

Expected response (200 OK):
```json
{
  "topics": [
    {"name": "orders", "subscribers": 0},
    {"name": "notifications", "subscribers": 0}
  ]
}
```

### 5. Try Duplicate Creation (Should Fail)

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"orders"}'
```

Expected response (409 Conflict):
```json
{
  "status": "exists",
  "topic": "orders"
}
```

### 6. Try Empty Name (Should Fail)

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":""}'
```

Expected response (400 Bad Request):
```json
{
  "error": "Bad request",
  "message": "Topic name cannot be empty"
}
```

### 7. Try Missing Name (Should Fail)

```bash
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response (400 Bad Request):
```json
{
  "error": "Bad request",
  "message": "Topic name is required"
}
```

## Automated Test Script

If you have `jq` installed (for pretty JSON formatting):

```bash
./testApiTopics.sh
```

If you don't have `jq`, you can still run the commands manually as shown above.

## Common Issues

### Server not responding
- Make sure `npm run dev` is running
- Check that port 3000 is not in use by another process

### "Cannot find module" errors
- Run `npm install` first

### JSON parse errors
- Ensure you're using single quotes around the JSON data in curl
- Ensure proper escaping of quotes in the JSON

## Windows Users

For Windows Command Prompt, use double quotes and escape inner quotes:

```cmd
curl -X POST http://localhost:3000/api/topics -H "Content-Type: application/json" -d "{\"name\":\"orders\"}"
```

For PowerShell, use backticks to escape:

```powershell
curl -X POST http://localhost:3000/api/topics `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"orders\"}'
```

