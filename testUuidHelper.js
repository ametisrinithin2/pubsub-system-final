/**
 * Test script for UUID helper
 * 
 * Verifies UUID generation and validation functions
 * 
 * Run with: node testUuidHelper.js
 */

const { generateUUID, isUUIDish } = require('./lib/uuidHelper');

console.log('=== Testing UUID Helper ===\n');

// Test 1: Generate multiple UUIDs
console.log('Test 1: Generate 5 UUIDs');
for (let i = 0; i < 5; i++) {
  const uuid = generateUUID();
  console.log(`  ${i + 1}. ${uuid}`);
}
console.log('✓ UUID generation works\n');

// Test 2: Validate UUIDs
console.log('Test 2: Validate UUID formats');

const validUUIDs = [
  'a1b2c3d4-e5f6-4789-abcd-ef0123456789',  // Standard UUID v4
  '550e8400-e29b-41d4-a716-446655440000',  // Another valid UUID
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',  // UUID v1
  generateUUID()                            // Our generated UUID
];

validUUIDs.forEach(uuid => {
  const isValid = isUUIDish(uuid);
  console.log(`  ${uuid}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});
console.log('');

// Test 3: Validate invalid UUIDs
console.log('Test 3: Validate invalid formats (should be false)');

const invalidUUIDs = [
  'not-a-uuid',
  '123',
  'abc-def',
  '',
  null,
  undefined,
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'  // Wrong characters
];

invalidUUIDs.forEach(uuid => {
  const isValid = isUUIDish(uuid);
  const display = uuid === null ? 'null' : uuid === undefined ? 'undefined' : `"${uuid}"`;
  console.log(`  ${display}: ${isValid ? '✓ Valid (unexpected!)' : '✗ Invalid (expected)'}`);
});
console.log('');

// Test 4: Check uniqueness
console.log('Test 4: Check UUID uniqueness (generate 1000 UUIDs)');
const uuids = new Set();
for (let i = 0; i < 1000; i++) {
  uuids.add(generateUUID());
}
console.log(`  Generated: 1000`);
console.log(`  Unique: ${uuids.size}`);
console.assert(uuids.size === 1000, 'All UUIDs should be unique');
console.log('✓ All UUIDs are unique\n');

// Test 5: Validate generated UUIDs
console.log('Test 5: Validate all generated UUIDs');
let allValid = true;
for (const uuid of uuids) {
  if (!isUUIDish(uuid)) {
    console.log(`  ✗ Generated invalid UUID: ${uuid}`);
    allValid = false;
  }
}
if (allValid) {
  console.log('  ✓ All generated UUIDs pass validation');
}
console.log('');

console.log('=== All Tests Passed! ===');

