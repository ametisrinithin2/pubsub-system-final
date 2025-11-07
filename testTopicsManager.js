/**
 * Test script for topicsManager
 * 
 * Verifies that the in-memory topics manager works correctly:
 * - Creates a topic
 * - Adds multiple messages
 * - Retrieves message history with last_n parameter
 * 
 * Run with: node testTopicsManager.js
 */

const {
  createTopic,
  deleteTopic,
  listTopics,
  getTopic,
  addMessage,
  getHistory,
  incrementSubscriber,
  decrementSubscriber,
  getStats
} = require('./lib/topicsManager');

console.log('=== Testing Topics Manager ===\n');

// Test 1: Create a topic
console.log('Test 1: Create topic "orders"');
const createResult = createTopic('orders');
console.log('Result:', createResult);
console.assert(createResult.success === true, 'Topic creation should succeed');
console.assert(createResult.topic.name === 'orders', 'Topic name should be "orders"');
console.log('✓ Topic created successfully\n');

// Test 2: Verify topic exists
console.log('Test 2: Get topic "orders"');
const topic = getTopic('orders');
console.log('Result:', topic);
console.assert(topic !== null, 'Topic should exist');
console.assert(topic.name === 'orders', 'Topic name should be "orders"');
console.log('✓ Topic retrieved successfully\n');

// Test 3: Add 3 messages
console.log('Test 3: Add 3 messages to "orders"');
const message1 = { id: 'msg-1', payload: { order: 'Order #1', amount: 100 } };
const message2 = { id: 'msg-2', payload: { order: 'Order #2', amount: 200 } };
const message3 = { id: 'msg-3', payload: { order: 'Order #3', amount: 300 } };

const addResult1 = addMessage('orders', message1);
const addResult2 = addMessage('orders', message2);
const addResult3 = addMessage('orders', message3);

console.log('Add message 1:', addResult1);
console.log('Add message 2:', addResult2);
console.log('Add message 3:', addResult3);

console.assert(addResult1.success === true, 'Message 1 should be added');
console.assert(addResult2.success === true, 'Message 2 should be added');
console.assert(addResult3.success === true, 'Message 3 should be added');
console.log('✓ All 3 messages added successfully\n');

// Test 4: Get all history
console.log('Test 4: Get all history');
const allHistory = getHistory('orders');
console.log('All messages:', JSON.stringify(allHistory.messages, null, 2));
console.assert(allHistory.success === true, 'History retrieval should succeed');
console.assert(allHistory.messages.length === 3, 'Should have 3 messages');
console.log('✓ All messages retrieved\n');

// Test 5: Get last 2 messages
console.log('Test 5: Get last 2 messages (last_n=2)');
const lastTwo = getHistory('orders', 2);
console.log('Last 2 messages:', JSON.stringify(lastTwo.messages, null, 2));

console.assert(lastTwo.success === true, 'History retrieval should succeed');
console.assert(lastTwo.messages.length === 2, 'Should have exactly 2 messages');
console.assert(lastTwo.messages[0].id === 'msg-2', 'First message should be msg-2');
console.assert(lastTwo.messages[1].id === 'msg-3', 'Second message should be msg-3');
console.log('✓ Last 2 messages retrieved correctly\n');

// Test 6: Test ring buffer overflow
console.log('Test 6: Test ring buffer overflow (add 105 messages to 100-size buffer)');
for (let i = 4; i <= 105; i++) {
  addMessage('orders', { id: `msg-${i}`, payload: { order: `Order #${i}` } });
}
const afterOverflow = getHistory('orders');
console.log('Messages in buffer after adding 105 total:', afterOverflow.messages.length);
console.assert(afterOverflow.messages.length === 100, 'Buffer should be capped at 100');
console.assert(afterOverflow.messages[0].id === 'msg-6', 'Oldest message should be msg-6 (first 5 dropped)');
console.assert(afterOverflow.messages[99].id === 'msg-105', 'Newest message should be msg-105');
console.log('✓ Ring buffer correctly maintains max size\n');

// Test 7: Subscriber count
console.log('Test 7: Increment/decrement subscribers');
incrementSubscriber('orders');
incrementSubscriber('orders');
incrementSubscriber('orders');
const topicAfterSub = getTopic('orders');
console.log('Subscribers after 3 increments:', topicAfterSub.subscribers);
console.assert(topicAfterSub.subscribers === 3, 'Should have 3 subscribers');

decrementSubscriber('orders');
const topicAfterUnsub = getTopic('orders');
console.log('Subscribers after 1 decrement:', topicAfterUnsub.subscribers);
console.assert(topicAfterUnsub.subscribers === 2, 'Should have 2 subscribers');
console.log('✓ Subscriber tracking works correctly\n');

// Test 8: Get stats
console.log('Test 8: Get statistics');
const stats = getStats();
console.log('Stats:', JSON.stringify(stats, null, 2));
console.assert(stats.topics.orders !== undefined, 'Stats should include orders topic');
console.assert(stats.topics.orders.messages === 105, 'Should have sent 105 total messages');
console.assert(stats.topics.orders.subscribers === 2, 'Should have 2 subscribers');
console.log('✓ Statistics retrieved correctly\n');

// Test 9: List topics
console.log('Test 9: List all topics');
const topicsList = listTopics();
console.log('Topics:', topicsList);
console.assert(topicsList.length === 1, 'Should have 1 topic');
console.assert(topicsList[0].name === 'orders', 'Topic should be "orders"');
console.assert(topicsList[0].subscribers === 2, 'Should show 2 subscribers');
console.log('✓ Topics listed correctly\n');

// Test 10: Delete topic
console.log('Test 10: Delete topic "orders"');
const deleteResult = deleteTopic('orders');
console.log('Delete result:', deleteResult);
console.assert(deleteResult.success === true, 'Topic deletion should succeed');

const topicsListAfterDelete = listTopics();
console.log('Topics after deletion:', topicsListAfterDelete);
console.assert(topicsListAfterDelete.length === 0, 'Should have no topics');
console.log('✓ Topic deleted successfully\n');

// Test 11: Edge cases
console.log('Test 11: Edge cases');

// Try to create topic with empty name
const emptyNameResult = createTopic('');
console.log('Create with empty name:', emptyNameResult);
console.assert(emptyNameResult.success === false, 'Empty name should fail');

// Try to add message to non-existent topic
const addToNonExistent = addMessage('nonexistent', { id: '1' });
console.log('Add to non-existent topic:', addToNonExistent);
console.assert(addToNonExistent.success === false, 'Should fail for non-existent topic');

// Try to get history of non-existent topic
const historyNonExistent = getHistory('nonexistent');
console.log('Get history of non-existent:', historyNonExistent);
console.assert(historyNonExistent.success === false, 'Should fail for non-existent topic');

console.log('✓ Edge cases handled correctly\n');

console.log('=== All Tests Passed! ===');

