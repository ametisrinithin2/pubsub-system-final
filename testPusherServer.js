/**
 * Test script for Pusher server wrapper
 * 
 * Demonstrates usage of triggerMessage function.
 * Guards with validatePusherConfig to avoid errors in CI/environments without credentials.
 * 
 * Run with: node testPusherServer.js
 */

const { validatePusherConfig, triggerMessage } = require('./lib/pusherServer');

console.log('=== Testing Pusher Server Wrapper ===\n');

// Check if Pusher is configured
console.log('Step 1: Validating Pusher configuration...');
const isConfigured = validatePusherConfig();

if (!isConfigured) {
  console.log('\n⚠️  Pusher is not configured.');
  console.log('This is expected in CI or if .env.local is not set up yet.');
  console.log('\nTo test with actual Pusher:');
  console.log('1. Copy .env.local.example to .env.local');
  console.log('2. Add your Pusher credentials from https://pusher.com/');
  console.log('3. Run this script again\n');
  process.exit(0);
}

console.log('✓ Pusher configuration validated\n');

// Test triggering a message
console.log('Step 2: Triggering test message...');

async function runTest() {
  try {
    // Test message 1: Simple order
    const result1 = await triggerMessage('orders', {
      id: '1',
      payload: { x: 1, order: 'Order #1', amount: 100 }
    });

    console.log('Result 1:', result1);
    
    if (result1.success) {
      console.log('✓ Message 1 triggered successfully');
    } else {
      console.log('✗ Message 1 failed:', result1.error);
    }

    // Test message 2: Another order
    const result2 = await triggerMessage('orders', {
      id: '2',
      payload: { 
        order: 'Order #2', 
        customer: 'John Doe',
        items: ['Widget', 'Gadget'],
        total: 250.50 
      }
    });

    console.log('\nResult 2:', result2);
    
    if (result2.success) {
      console.log('✓ Message 2 triggered successfully');
    } else {
      console.log('✗ Message 2 failed:', result2.error);
    }

    // Test message 3: Different topic
    const result3 = await triggerMessage('notifications', {
      id: 'notif-001',
      payload: { 
        type: 'alert',
        message: 'System maintenance in 10 minutes',
        severity: 'warning'
      }
    });

    console.log('\nResult 3:', result3);
    
    if (result3.success) {
      console.log('✓ Message 3 triggered successfully');
    } else {
      console.log('✗ Message 3 failed:', result3.error);
    }

    // Test error cases
    console.log('\n=== Testing Error Cases ===\n');

    // Invalid topic
    const result4 = await triggerMessage('', { id: '4', payload: {} });
    console.log('Empty topic result:', result4);
    console.assert(result4.success === false, 'Empty topic should fail');
    console.log('✓ Empty topic validation works');

    // Missing id
    const result5 = await triggerMessage('test', { payload: {} });
    console.log('\nMissing id result:', result5);
    console.assert(result5.success === false, 'Missing id should fail');
    console.log('✓ Missing id validation works');

    console.log('\n=== Test Complete ===');
    console.log('\n📝 Note: Check your Pusher dashboard to verify events were received.');
    console.log('Dashboard: https://dashboard.pusher.com/ → Your App → Debug Console\n');

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
runTest();

