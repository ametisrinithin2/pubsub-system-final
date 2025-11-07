/**
 * GET /api/history - Message history endpoint
 * 
 * Returns the last N messages from a topic's ring buffer.
 * Supports replay functionality for new subscribers.
 * 
 * Query Parameters:
 * - topic (required): Topic name
 * - last_n (optional): Number of messages to retrieve (default: 10, max: 100)
 * 
 * CURL EXAMPLES:
 * 
 * Get last 5 messages from "orders" topic:
 * curl "http://localhost:3000/api/history?topic=orders&last_n=5"
 * 
 * Get last 10 messages (default):
 * curl "http://localhost:3000/api/history?topic=orders"
 * 
 * Get all available messages (up to 100):
 * curl "http://localhost:3000/api/history?topic=orders&last_n=100"
 */

const { getTopic, getHistory } = require('../../lib/topicsManager');

// Configuration
const DEFAULT_LAST_N = 10;
const MAX_LAST_N = 100;

export default async function handler(req, res) {
  // Only support GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: `Method ${req.method} is not supported for this endpoint`,
      allowedMethods: ['GET']
    });
  }

  try {
    // Extract query parameters
    const { topic, last_n } = req.query;

    // Validate topic parameter
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOPIC',
          message: 'Topic query parameter is required and must be a string'
        }
      });
    }

    const trimmedTopic = topic.trim();

    if (trimmedTopic.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOPIC',
          message: 'Topic cannot be empty'
        }
      });
    }

    // Check if topic exists
    const topicObj = getTopic(trimmedTopic);
    if (!topicObj) {
      return res.status(404).json({
        error: {
          code: 'TOPIC_NOT_FOUND',
          message: `Topic '${trimmedTopic}' does not exist`
        }
      });
    }

    // Parse and validate last_n parameter
    let lastN = DEFAULT_LAST_N;

    if (last_n) {
      const parsed = parseInt(last_n, 10);

      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_LAST_N',
            message: 'last_n must be a positive integer'
          }
        });
      }

      // Apply max limit
      lastN = Math.min(parsed, MAX_LAST_N);

      // Log if we capped the value
      if (parsed > MAX_LAST_N) {
        console.warn(`⚠️  Requested last_n=${parsed} exceeds max (${MAX_LAST_N}). Capping to ${MAX_LAST_N}.`);
      }
    }

    // Get message history
    const result = getHistory(trimmedTopic, lastN);

    if (!result.success) {
      return res.status(500).json({
        error: {
          code: 'RETRIEVAL_ERROR',
          message: result.error || 'Failed to retrieve message history'
        }
      });
    }

    // Return history response
    return res.status(200).json({
      topic: trimmedTopic,
      messages: result.messages,
      count: result.messages.length,
      requested: lastN
    });

  } catch (error) {
    console.error('Error in history endpoint:', error);
    return res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: error.message
      }
    });
  }
}

