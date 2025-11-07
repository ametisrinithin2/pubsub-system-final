/**
 * POST /api/publish - Publish a message to a topic
 * 
 * This endpoint validates the payload, stores the message in memory,
 * and emits it to Pusher for real-time delivery to subscribers.
 * 
 * CURL EXAMPLES:
 * 
 * Publish a message with ID:
 * curl -X POST http://localhost:3000/api/publish \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "topic": "orders",
 *     "message": {
 *       "id": "msg-123",
 *       "payload": {"order": "Order #1", "amount": 100}
 *     }
 *   }'
 * 
 * Publish without ID (will auto-generate):
 * curl -X POST http://localhost:3000/api/publish \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "topic": "orders",
 *     "message": {
 *       "payload": {"order": "Order #2", "amount": 200}
 *     }
 *   }'
 * 
 * Publish with request_id for tracking:
 * curl -X POST http://localhost:3000/api/publish \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "topic": "orders",
 *     "message": {"id": "msg-456", "payload": {"test": true}},
 *     "request_id": "req-abc-123"
 *   }'
 */

const { getTopic, addMessage } = require('../../lib/topicsManager');
const { triggerMessage, validatePusherConfig } = require('../../lib/pusherServer');
const { generateUUID, isUUIDish } = require('../../lib/uuidHelper');

export default async function handler(req, res) {
  // Only support POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: `Method ${req.method} is not supported for this endpoint`,
      allowedMethods: ['POST']
    });
  }

  try {
    // Parse request body
    const { topic, message, request_id } = req.body;

    // Validate topic field
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        code: 'INVALID_TOPIC',
        message: 'Topic is required and must be a string'
      });
    }

    // Validate message field
    if (!message || typeof message !== 'object') {
      return res.status(400).json({
        error: 'Bad request',
        code: 'INVALID_MESSAGE',
        message: 'Message is required and must be an object'
      });
    }

    // Check if topic exists
    const topicObj = getTopic(topic);
    if (!topicObj) {
      return res.status(404).json({
        error: 'Topic not found',
        code: 'TOPIC_NOT_FOUND',
        message: `Topic '${topic}' does not exist. Create it first using POST /api/topics`,
        topic: topic
      });
    }

    // Generate UUID if message.id is missing
    if (!message.id) {
      message.id = generateUUID();
      console.log(`Generated UUID for message: ${message.id}`);
    }

    // Validate message.id is UUID-ish (relaxed validation, just warn if not)
    if (!isUUIDish(message.id)) {
      console.warn(`⚠️  Message ID '${message.id}' does not look like a UUID. This is allowed but not recommended.`);
    }

    // Validate payload exists (can be any type)
    if (!message.hasOwnProperty('payload')) {
      return res.status(400).json({
        error: 'Bad request',
        code: 'MISSING_PAYLOAD',
        message: 'Message must have a payload field'
      });
    }

    // Store message in memory (topicsManager)
    const addResult = addMessage(topic, message);
    if (!addResult.success) {
      return res.status(500).json({
        error: 'Failed to store message',
        code: 'STORAGE_ERROR',
        message: addResult.error
      });
    }

    console.log(`✓ Message stored in topic '${topic}': ${message.id}`);

    // Check if Pusher is configured
    if (!validatePusherConfig()) {
      // Pusher not configured - message is stored but not broadcasted
      console.warn('⚠️  Pusher not configured. Message stored but not broadcasted.');
      
      const response = {
        status: 'ok',
        topic: topic,
        message_id: message.id,
        broadcast: false,
        warning: 'Message stored but not broadcasted (Pusher not configured)'
      };

      if (request_id) {
        response.request_id = request_id;
      }

      return res.status(200).json(response);
    }

    // Trigger message to Pusher (real-time broadcast)
    const triggerResult = await triggerMessage(topic, message);
    
    if (!triggerResult.success) {
      // Message stored but broadcast failed
      console.error(`✗ Failed to broadcast message to Pusher: ${triggerResult.error}`);
      
      const response = {
        status: 'ok',
        topic: topic,
        message_id: message.id,
        broadcast: false,
        warning: `Message stored but broadcast failed: ${triggerResult.error}`
      };

      if (request_id) {
        response.request_id = request_id;
      }

      return res.status(200).json(response);
    }

    console.log(`✓ Message broadcasted to Pusher channel 'topic-${topic}': ${message.id}`);

    // Success - message stored and broadcasted
    const response = {
      status: 'ok',
      topic: topic,
      message_id: message.id,
      broadcast: true
    };

    // Echo request_id if provided
    if (request_id) {
      response.request_id = request_id;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error publishing message:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        error: 'Bad request',
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
}

