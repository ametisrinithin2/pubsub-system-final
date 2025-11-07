/**
 * GET /api/health - Health check endpoint
 * 
 * Returns server health information including uptime, topic count, and total subscribers.
 * 
 * CURL EXAMPLES:
 * 
 * Get health status:
 * curl http://localhost:3000/api/health
 * 
 * Example response:
 * {
 *   "uptime_sec": 123.456,
 *   "topics": 5,
 *   "subscribers": 12
 * }
 */

const { listTopics } = require('../../lib/topicsManager');

// Store server start timestamp at module initialization
// This persists for the lifetime of the Node.js process
const START_TS = Date.now();

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
    // Calculate uptime in seconds
    const uptimeMs = Date.now() - START_TS;
    const uptimeSec = parseFloat((uptimeMs / 1000).toFixed(3));

    // Get all topics
    const topics = listTopics();

    // Count total subscribers across all topics
    const totalSubscribers = topics.reduce((sum, topic) => sum + topic.subscribers, 0);

    // Return health response
    return res.status(200).json({
      uptime_sec: uptimeSec,
      topics: topics.length,
      subscribers: totalSubscribers
    });

  } catch (error) {
    console.error('Error in health endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

