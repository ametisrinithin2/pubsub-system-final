/**
 * Pusher Server Wrapper
 * 
 * Wrapper around Pusher server SDK for triggering real-time events.
 * Used by API routes to publish messages to topic channels.
 * 
 * Channel naming convention: topic-<topicName>
 * Event name: event-message
 */

const Pusher = require('pusher');

/**
 * Validate that all required Pusher environment variables are present
 * @returns {boolean} True if all required env vars exist
 */
function validatePusherConfig() {
  // const required = ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER'];
  // const missing = required.filter(key => !process.env[key]);
  
  // if (missing.length > 0) {
  //   console.error('❌ Missing Pusher environment variables:', missing.join(', '));
  //   console.error('Please set these in your .env.local file');
  //   return false;
  // }
  
  return true;
}

// Initialize Pusher client (lazy initialization)
let pusherClient = null;

/**
 * Get or initialize the Pusher client instance
 * @returns {Pusher|null} Pusher client or null if config invalid
 */
function getPusherClient() {
  // Return existing client if already initialized
  if (pusherClient) {
    return pusherClient;
  }

  // Validate configuration
  if (!validatePusherConfig()) {
    return null;
  }

  try {
    // Initialize Pusher with TLS enabled
    pusherClient = new Pusher({
      appId: "2073668",
      key: "389fa24406146c35e15b",
      secret: "0d3698be9ce958653683",
      cluster: "ap2",
      useTLS: true // Use TLS for secure connections
    });

    console.log('✓ Pusher server client initialized');
    return pusherClient;
  } catch (error) {
    console.error('❌ Failed to initialize Pusher client:', error.message);
    return null;
  }
}

/**
 * Trigger a message event to a topic channel
 * 
 * @param {string} topic - Topic name (will be prefixed with "topic-")
 * @param {Object} message - Message object with id and payload
 * @param {string} message.id - Unique message identifier
 * @param {*} message.payload - Message payload (any JSON-serializable data)
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
async function triggerMessage(topic, message) {
  // Validate inputs
  if (!topic || typeof topic !== 'string') {
    return { success: false, error: 'Topic must be a non-empty string' };
  }

  if (!message || typeof message !== 'object') {
    return { success: false, error: 'Message must be an object' };
  }

  if (!message.id) {
    return { success: false, error: 'Message must have an id field' };
  }

  // Get Pusher client
  const client = getPusherClient();
  if (!client) {
    return { 
      success: false, 
      error: 'Pusher client not initialized. Check environment variables.' 
    };
  }

  try {
    // Build channel name: topic-<topicName>
    const channelName = `topic-${topic}`;

    // Build event payload with timestamp
    const eventPayload = {
      id: message.id,
      payload: message.payload,
      ts: new Date().toISOString()
    };

    // Trigger the event
    await client.trigger(
      channelName,        // Channel name
      'event-message',    // Event name
      eventPayload        // Event data
    );

    console.log(`✓ Message triggered: channel=${channelName}, id=${message.id}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to trigger message:', error.message);
    return { 
      success: false, 
      error: `Pusher trigger failed: ${error.message}` 
    };
  }
}

/**
 * Trigger messages to multiple channels (batch operation)
 * @param {Array<{topic: string, message: Object}>} items - Array of topic/message pairs
 * @returns {Promise<Object>} { success: boolean, results: Array, error?: string }
 */
async function triggerBatch(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'Items must be a non-empty array' };
  }

  const client = getPusherClient();
  if (!client) {
    return { 
      success: false, 
      error: 'Pusher client not initialized. Check environment variables.' 
    };
  }

  try {
    // Trigger all messages in parallel
    const results = await Promise.allSettled(
      items.map(({ topic, message }) => triggerMessage(topic, message))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`✓ Batch trigger: ${successful} succeeded, ${failed} failed`);

    return {
      success: failed === 0,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Batch trigger failed: ${error.message}` 
    };
  }
}

// Export functions
module.exports = {
  validatePusherConfig,
  triggerMessage,
  triggerBatch,
  getPusherClient
};

