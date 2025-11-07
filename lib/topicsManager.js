/**
 * In-Memory Topics Manager
 * 
 * Manages topics, subscriptions, message counts, and a bounded ring buffer for message replay.
 * 
 * ASSUMPTIONS & LIMITATIONS:
 * - No persistent storage: all data is lost on server restart
 * - In serverless (Vercel), each function invocation may have its own memory space
 * - Concurrent requests in the same Node process are safe (single-threaded event loop)
 * - For true distributed state, would need external storage (Redis, DB, etc.)
 * - Ring buffer is bounded (default 100 messages) to prevent memory exhaustion
 */

// Internal storage: Map of topic name -> topic object
const topics = new Map();

// Default ring buffer size
const DEFAULT_BUFFER_SIZE = 100;

/**
 * Create a new topic
 * @param {string} name - Topic name
 * @returns {Object} { success: boolean, topic?: Object, error?: string }
 */
function createTopic(name) {
  // Validate input
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { success: false, error: 'Topic name must be a non-empty string' };
  }

  const trimmedName = name.trim();

  // Check if topic already exists
  if (topics.has(trimmedName)) {
    return { success: false, error: 'Topic already exists', topic: topics.get(trimmedName) };
  }

  // Create new topic object
  const topic = {
    name: trimmedName,
    subscribers: 0,
    messageCount: 0,
    ringBuffer: [],
    bufferSize: DEFAULT_BUFFER_SIZE,
    createdAt: new Date().toISOString()
  };

  topics.set(trimmedName, topic);

  return { success: true, topic };
}

/**
 * Delete a topic
 * @param {string} name - Topic name
 * @returns {Object} { success: boolean, error?: string }
 */
function deleteTopic(name) {
  if (!name || typeof name !== 'string') {
    return { success: false, error: 'Invalid topic name' };
  }

  const trimmedName = name.trim();

  if (!topics.has(trimmedName)) {
    return { success: false, error: 'Topic not found' };
  }

  topics.delete(trimmedName);
  return { success: true };
}

/**
 * List all topics with subscriber counts
 * @returns {Array} Array of { name, subscribers }
 */
function listTopics() {
  const topicsList = [];
  
  for (const [name, topic] of topics.entries()) {
    topicsList.push({
      name: topic.name,
      subscribers: topic.subscribers
    });
  }

  return topicsList;
}

/**
 * Get a specific topic by name
 * @param {string} name - Topic name
 * @returns {Object|null} Topic object or null if not found
 */
function getTopic(name) {
  if (!name || typeof name !== 'string') {
    return null;
  }

  return topics.get(name.trim()) || null;
}

/**
 * Add a message to a topic's ring buffer
 * @param {string} topicName - Topic name
 * @param {Object} message - Message object (should have id, payload, etc.)
 * @returns {Object} { success: boolean, error?: string }
 */
function addMessage(topicName, message) {
  if (!topicName || typeof topicName !== 'string') {
    return { success: false, error: 'Invalid topic name' };
  }

  if (!message || typeof message !== 'object') {
    return { success: false, error: 'Message must be an object' };
  }

  const topic = topics.get(topicName.trim());

  if (!topic) {
    return { success: false, error: 'Topic not found' };
  }

  // Add timestamp if not present
  const messageWithTimestamp = {
    ...message,
    timestamp: message.timestamp || new Date().toISOString()
  };

  // Add to ring buffer
  topic.ringBuffer.push(messageWithTimestamp);

  // If buffer exceeds size, remove oldest (FIFO)
  if (topic.ringBuffer.length > topic.bufferSize) {
    topic.ringBuffer.shift(); // Remove first (oldest) element
  }

  // Increment message count (total messages ever sent)
  topic.messageCount += 1;

  return { success: true };
}

/**
 * Get message history for a topic
 * @param {string} topicName - Topic name
 * @param {number} lastN - Number of recent messages to retrieve (default: all)
 * @returns {Object} { success: boolean, messages?: Array, error?: string }
 */
function getHistory(topicName, lastN) {
  if (!topicName || typeof topicName !== 'string') {
    return { success: false, error: 'Invalid topic name' };
  }

  const topic = topics.get(topicName.trim());

  if (!topic) {
    return { success: false, error: 'Topic not found' };
  }

  // If lastN is not specified or invalid, return all messages
  if (!lastN || typeof lastN !== 'number' || lastN <= 0) {
    return { success: true, messages: [...topic.ringBuffer] };
  }

  // Return last N messages
  const messages = topic.ringBuffer.slice(-lastN);
  return { success: true, messages };
}

/**
 * Increment subscriber count for a topic
 * @param {string} topicName - Topic name
 * @returns {Object} { success: boolean, count?: number, error?: string }
 */
function incrementSubscriber(topicName) {
  if (!topicName || typeof topicName !== 'string') {
    return { success: false, error: 'Invalid topic name' };
  }

  const topic = topics.get(topicName.trim());

  if (!topic) {
    return { success: false, error: 'Topic not found' };
  }

  topic.subscribers += 1;
  return { success: true, count: topic.subscribers };
}

/**
 * Decrement subscriber count for a topic
 * @param {string} topicName - Topic name
 * @returns {Object} { success: boolean, count?: number, error?: string }
 */
function decrementSubscriber(topicName) {
  if (!topicName || typeof topicName !== 'string') {
    return { success: false, error: 'Invalid topic name' };
  }

  const topic = topics.get(topicName.trim());

  if (!topic) {
    return { success: false, error: 'Topic not found' };
  }

  // Prevent negative subscriber counts
  if (topic.subscribers > 0) {
    topic.subscribers -= 1;
  }

  return { success: true, count: topic.subscribers };
}

/**
 * Get statistics for all topics
 * @returns {Object} Statistics object with per-topic details
 */
function getStats() {
  const stats = {
    topics: {}
  };

  for (const [name, topic] of topics.entries()) {
    stats.topics[name] = {
      messages: topic.messageCount,
      subscribers: topic.subscribers,
      bufferSize: topic.ringBuffer.length,
      bufferCapacity: topic.bufferSize
    };
  }

  return stats;
}

/**
 * CONCURRENCY NOTES:
 * 
 * Node.js event loop is single-threaded, so these operations are atomic within
 * a single process. However, in serverless environments like Vercel:
 * 
 * 1. Multiple function instances may run in parallel (different containers)
 * 2. Each instance has its own memory space (no shared state)
 * 3. This means topics created in one instance won't be visible in another
 * 
 * For production distributed pub/sub, consider:
 * - Redis for shared state across instances
 * - DynamoDB or similar for persistent topic registry
 * - Pusher Channels API for topic/channel management
 * 
 * For this demo/assignment, we accept these limitations and document them.
 */

// Export all functions
module.exports = {
  createTopic,
  deleteTopic,
  listTopics,
  getTopic,
  addMessage,
  getHistory,
  incrementSubscriber,
  decrementSubscriber,
  getStats
};

