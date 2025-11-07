/**
 * POST /api/topics - Create a new topic
 * GET /api/topics - List all topics
 * 
 * This endpoint manages topic creation and retrieval using the in-memory topicsManager.
 * 
 * CURL EXAMPLES:
 * 
 * Create a topic:
 * curl -X POST http://localhost:3000/api/topics \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"orders"}'
 * 
 * List all topics:
 * curl http://localhost:3000/api/topics
 * 
 * Test duplicate creation (should return 409):
 * curl -X POST http://localhost:3000/api/topics \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"orders"}'
 */

const { createTopic, listTopics } = require('../../lib/topicsManager');
const { getPusherClient, validatePusherConfig } = require('../../lib/pusherServer');

export default async function handler(req, res) {
  // Handle GET - List all topics
  if (req.method === 'GET') {
    try {
      const topics = listTopics();
      
      return res.status(200).json({
        topics: topics
      });
    } catch (error) {
      console.error('Error listing topics:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Handle POST - Create a new topic
  if (req.method === 'POST') {
    try {
      // Parse request body (Next.js automatically parses JSON)
      const { name } = req.body;

      // Validate input - name must be a non-empty string
      if (!name) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Topic name is required'
        });
      }

      if (typeof name !== 'string') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Topic name must be a string'
        });
      }

      if (name.trim().length === 0) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Topic name cannot be empty'
        });
      }

      // Attempt to create the topic
      const result = createTopic(name);

      // Topic already exists - return 409 Conflict
      if (!result.success && result.error === 'Topic already exists') {
        return res.status(409).json({
          status: 'exists',
          topic: result.topic.name
        });
      }

      // Other error occurred
      if (!result.success) {
        return res.status(400).json({
          error: 'Bad request',
          message: result.error
        });
      }

      // Success - topic created
      const topicName = result.topic.name;

      // Emit Pusher event for topic creation (non-blocking)
      // This allows frontends to update their topic list in real-time
      if (validatePusherConfig()) {
        const pusherClient = getPusherClient();
        if (pusherClient) {
          // Fire and forget - don't await, just log on error
          pusherClient.trigger('control-topics', 'topic_created', {
            topic: topicName,
            ts: new Date().toISOString()
          }).catch(error => {
            console.error(`⚠️  Failed to emit topic_created event for '${topicName}':`, error.message);
          });
          console.log(`✓ Emitted topic_created event for '${topicName}'`);
        }
      }

      return res.status(201).json({
        status: 'created',
        topic: topicName
      });

    } catch (error) {
      console.error('Error creating topic:', error);
      
      // Handle JSON parse errors
      if (error instanceof SyntaxError) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Invalid JSON in request body'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    error: 'Method not allowed',
    message: `Method ${req.method} is not supported for this endpoint`,
    allowedMethods: ['GET', 'POST']
  });
}

