/**
 * UUID Helper
 * 
 * Simple UUID generation without external dependencies.
 * Uses crypto.randomUUID() if available, otherwise falls back to timestamp + random.
 */

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  // Try to use native crypto.randomUUID() (available in Node 14.17+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: Generate UUID-like string using timestamp + random
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const timestamp = Date.now().toString(16);
  const random1 = Math.random().toString(16).substring(2, 10);
  const random2 = Math.random().toString(16).substring(2, 6);
  const random3 = Math.random().toString(16).substring(2, 6);
  const random4 = Math.random().toString(16).substring(2, 14);

  return `${timestamp.padStart(8, '0')}-${random1.substring(0, 4)}-4${random2.substring(0, 3)}-${random3.substring(0, 4)}-${random4}`;
}

/**
 * Validate if a string looks like a UUID
 * @param {string} str - String to validate
 * @returns {boolean} True if string matches UUID pattern
 */
function isUUIDish(str) {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Relaxed UUID pattern - accepts various formats
  // Standard: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // Also accepts without dashes or with different versions
  const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  
  return uuidPattern.test(str);
}

module.exports = {
  generateUUID,
  isUUIDish
};

