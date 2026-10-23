/**
 * Automated test suite for time.utils and backend pipeline.
 */

const { parseTimestamp } = require('../src/utils/time.utils');
const { isValidYouTubeUrl } = require('../src/services/youtube.service');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

function assertThrows(fn, message) {
  try {
    fn();
    console.error(`❌ FAIL: ${message} (did not throw)`);
    process.exit(1);
  } catch (err) {
    console.log(`✅ PASS: ${message} (threw: "${err.message}")`);
  }
}

console.log('\n--- 1. Testing Timestamp Parsing (time.utils.js) ---');
// MM:SS format
assert(parseTimestamp('01:20') === 80, 'parseTimestamp("01:20") === 80');
assert(parseTimestamp('02:30') === 150, 'parseTimestamp("02:30") === 150');
assert(parseTimestamp('00:00') === 0, 'parseTimestamp("00:00") === 0');
assert(parseTimestamp('00:45') === 45, 'parseTimestamp("00:45") === 45');
assert(parseTimestamp('10:00') === 600, 'parseTimestamp("10:00") === 600');

// HH:MM:SS format
assert(parseTimestamp('01:02:30') === 3750, 'parseTimestamp("01:02:30") === 3750');
assert(parseTimestamp('00:01:20') === 80, 'parseTimestamp("00:01:20") === 80');
assert(parseTimestamp('02:00:00') === 7200, 'parseTimestamp("02:00:00") === 7200');

// Numeric formats
assert(parseTimestamp(45) === 45, 'parseTimestamp(45) === 45');
assert(parseTimestamp('45') === 45, 'parseTimestamp("45") === 45');

// Invalid and negative timestamps
assertThrows(() => parseTimestamp('-01:20'), 'Reject negative timestamp -01:20');
assertThrows(() => parseTimestamp('-10'), 'Reject negative number -10');
assertThrows(() => parseTimestamp(''), 'Reject empty timestamp');
assertThrows(() => parseTimestamp('invalid:time'), 'Reject invalid format');
assertThrows(() => parseTimestamp('01:60'), 'Reject invalid seconds 60 in MM:SS');
assertThrows(() => parseTimestamp('01:99:99'), 'Reject invalid MM/SS');

console.log('\n--- 2. Testing YouTube URL Validation (youtube.service.js) ---');
assert(isValidYouTubeUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ'), 'Standard watch URL');
assert(isValidYouTubeUrl('http://youtube.com/watch?v=aqz-KE-bpKQ'), 'HTTP watch URL');
assert(isValidYouTubeUrl('https://youtu.be/aqz-KE-bpKQ'), 'Shortened youtu.be URL');
assert(isValidYouTubeUrl('https://www.youtube.com/shorts/aqz-KE-bpKQ'), 'YouTube Shorts URL');
assert(isValidYouTubeUrl('https://m.youtube.com/watch?v=aqz-KE-bpKQ&t=10s'), 'Mobile URL with query param');

assert(!isValidYouTubeUrl(''), 'Empty string is invalid');
assert(!isValidYouTubeUrl('https://vimeo.com/12345'), 'Vimeo URL is rejected');
assert(!isValidYouTubeUrl('https://example.com/watch?v=12345'), 'Arbitrary domain is rejected');
assert(!isValidYouTubeUrl('https://youtube.com/something-else'), 'Invalid YouTube path is rejected');

console.log('\nAll unit tests passed successfully!\n');
