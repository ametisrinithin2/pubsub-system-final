/**
 * DELETE /api/topics/[name] - Delete a topic
 * 
 * This endpoint handles topic deletion with validation:
 * - Checks if topic exists
 * - Prevents deletion if topic has active subscribers
 * - Removes topic from in-memory storage
 * 
 * CURL EXAMPLES:
 * 
 * Delete a topic:
 * curl -X DELETE http://localhost:3000/api/topics/orders
 * 
 * Try to delete non-existent topic (should return 404):
 * curl -X DELETE http://localhost:3000/api/topics/nonexistent
 * 
 * Try to delete topic with subscribers (should return 409):
 * First create a topic and manually increment subscribers for testing:
 * curl -X DELETE http://localhost:3000/api/topics/orders
 */

const { getTopic, deleteTopic } = require('../../../lib/topicsManager');
const { getPusherClient, validatePusherConfig } = require('../../../lib/pusherServer');

export default async function handler(req, res) {
  // Only support DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: `Method ${req.method} is not supported for this endpoint`,
      allowedMethods: ['DELETE']
    });
  }

  try {
    // Extract topic name from dynamic route parameter
    const { name } = req.query;

    // Validate topic name
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Topic name is required and must be a string'
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Topic name cannot be empty'
      });
    }

    // Check if topic exists
    const topic = getTopic(trimmedName);

    if (!topic) {
      // Topic not found - return 404
      return res.status(404).json({
        status: 'not_found',
        topic: trimmedName
      });
    }

    // Check if topic has active subscribers
    if (topic.subscribers > 0) {
      // Cannot delete topic with active subscribers - return 409
      return res.status(409).json({
        status: 'has_subscribers',
        topic: trimmedName,
        subscribers: topic.subscribers,
        message: 'Cannot delete topic with active subscribers. Unsubscribe all clients first.'
      });
    }

    // Delete the topic
    const result = deleteTopic(trimmedName);

    if (!result.success) {
      // Unexpected error during deletion
      return res.status(500).json({
        error: 'Internal server error',
        message: result.error || 'Failed to delete topic'
      });
    }

    // Successfully deleted
    
    // Emit Pusher event for topic deletion (non-blocking)
    // This allows frontends to update their topic list in real-time
    if (validatePusherConfig()) {
      const pusherClient = getPusherClient();
      if (pusherClient) {
        // Fire and forget - don't await, just log on error
        pusherClient.trigger('control-topics', 'topic_deleted', {
          topic: trimmedName,
          ts: new Date().toISOString()
        }).catch(error => {
          console.error(`⚠️  Failed to emit topic_deleted event for '${trimmedName}':`, error.message);
        });
        console.log(`✓ Emitted topic_deleted event for '${trimmedName}'`);
      }
    }

    return res.status(200).json({
      status: 'deleted',
      topic: trimmedName
    });

  } catch (error) {
    console.error('Error deleting topic:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

