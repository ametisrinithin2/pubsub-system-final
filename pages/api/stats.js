/**
 * GET /api/stats - Statistics endpoint
 * 
 * Returns detailed statistics for all topics including message counts and subscribers.
 * 
 * CURL EXAMPLES:
 * 
 * Get statistics:
 * curl http://localhost:3000/api/stats
 * 
 * Example response:
 * {
 *   "topics": {
 *     "orders": {
 *       "messages": 42,
 *       "subscribers": 3
 *     },
 *     "notifications": {
 *       "messages": 15,
 *       "subscribers": 5
 *     }
 *   }
 * }
 */

const { getStats } = require('../../lib/topicsManager');

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
    // Get statistics from topics manager
    const stats = getStats();

    // Return stats in the expected format
    return res.status(200).json(stats);

  } catch (error) {
    console.error('Error in stats endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

