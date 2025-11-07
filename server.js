#!/usr/bin/env node

/**
 * Production server with graceful shutdown
 * 
 * This server script is designed for local Docker deployments and provides
 * graceful shutdown handling for SIGINT and SIGTERM signals.
 * 
 * Usage:
 *   node server.js
 * 
 * Note: For Vercel serverless deployments, this file is not used.
 * Vercel functions are automatically managed and have their own lifecycle.
 */

const { spawn } = require('child_process');

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('=== Next.js PubSub Server ===');
console.log(`Environment: ${NODE_ENV}`);
console.log(`Port: ${PORT}`);
console.log('');

// Start Next.js server
let nextProcess = null;
let isShuttingDown = false;

function startServer() {
  console.log('Starting Next.js server...');
  
  // Spawn Next.js process
  nextProcess = spawn('npx', ['next', 'start', '-p', PORT], {
    stdio: 'inherit',
    shell: true
  });

  nextProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

  nextProcess.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.error(`Server process exited unexpectedly with code ${code} and signal ${signal}`);
      process.exit(code || 1);
    }
  });

  console.log('✓ Server started');
  console.log(`✓ Listening on http://localhost:${PORT}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
}

/**
 * Graceful shutdown handler
 * 
 * Attempts to cleanly shut down the server when receiving termination signals.
 * This provides a best-effort approach to:
 * - Complete in-flight requests
 * - Close connections gracefully
 * - Log shutdown status
 * 
 * Limitations:
 * - In-memory data (topics, messages) will be lost
 * - Pusher connections are handled by the service itself
 * - No persistent state to flush in this demo application
 */
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;

  console.log('');
  console.log(`Received ${signal} - initiating graceful shutdown...`);
  console.log('');

  // Log current state before shutdown
  console.log('📊 Shutdown status:');
  console.log('  • Stopping server...');
  
  // Attempt to stop Next.js process
  if (nextProcess && !nextProcess.killed) {
    console.log('  • Sending SIGTERM to Next.js process...');
    
    // Give Next.js a chance to shut down gracefully
    nextProcess.kill('SIGTERM');
    
    // Wait a bit for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // If still running, force kill
    if (!nextProcess.killed) {
      console.log('  • Force killing Next.js process...');
      nextProcess.kill('SIGKILL');
    }
  }

  console.log('  • Server stopped');
  console.log('');
  console.log('⚠️  Note: In-memory data (topics, messages) has been lost');
  console.log('   For persistent data, use external storage (Redis, Database)');
  console.log('');
  console.log('✓ Graceful shutdown complete');
  
  // Exit
  process.exit(0);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

/**
 * DEPLOYMENT NOTES:
 * 
 * LOCAL/DOCKER:
 * - This script provides graceful shutdown for containerized deployments
 * - Use `node server.js` to start the server
 * - Handles SIGTERM/SIGINT for clean shutdown
 * 
 * VERCEL SERVERLESS:
 * - This script is NOT used on Vercel
 * - Vercel runs Next.js API routes as serverless functions
 * - Each function has its own lifecycle (cold start, execution, teardown)
 * - No persistent in-memory state across invocations
 * - Graceful shutdown is handled by Vercel's infrastructure
 * 
 * IN-MEMORY STATE LIMITATIONS:
 * - Topics and messages are stored in memory only
 * - Data is lost on server restart (intentional for this demo)
 * - For production, use external storage:
 *   • Redis for topics and message buffers
 *   • PostgreSQL/MongoDB for persistent topic registry
 *   • Pusher Channels API for distributed state
 */

