/**
 * Time utility functions for timestamp parsing and validation.
 */

/**
 * Parses a timestamp string into total seconds.
 * 
 * Supported formats:
 * - "MM:SS" (e.g., "01:20" -> 80, "02:30" -> 150)
 * - "HH:MM:SS" (e.g., "01:02:30" -> 3750)
 * - Raw numeric seconds as number or string (e.g., 45, "45")
 * 
 * Rejects invalid, negative, or malformed timestamps.
 * 
 * @param {string|number} timestamp - The timestamp to parse
 * @returns {number} The total time in seconds (integer)
 * @throws {Error} If the timestamp format is invalid or negative
 */
function parseTimestamp(timestamp) {
  if (timestamp === undefined || timestamp === null || timestamp === '') {
    throw new Error('Timestamp cannot be empty');
  }

  // If already a valid non-negative number
  if (typeof timestamp === 'number') {
    if (isNaN(timestamp) || timestamp < 0 || !isFinite(timestamp)) {
      throw new Error(`Invalid numeric timestamp: ${timestamp}`);
    }
    return Math.floor(timestamp);
  }

  const str = String(timestamp).trim();

  // Check for negative signs
  if (str.startsWith('-')) {
    throw new Error(`Negative timestamps are not allowed: "${str}"`);
  }

  // Check if it is a pure integer/float number string (e.g., "75")
  if (/^\d+(\.\d+)?$/.test(str)) {
    const parsed = parseFloat(str);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error(`Invalid numeric timestamp: "${str}"`);
    }
    return Math.floor(parsed);
  }

  // Match MM:SS or HH:MM:SS format
  // HH:MM:SS format (1-2 digits for hours, exactly 2 digits for minutes and seconds)
  const hhmmssRegex = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
  // MM:SS format (1-3 digits for minutes, exactly 2 digits for seconds)
  const mmssRegex = /^(\d{1,3}):([0-5]\d)$/;

  const hhmmssMatch = str.match(hhmmssRegex);
  if (hhmmssMatch) {
    const hours = parseInt(hhmmssMatch[1], 10);
    const minutes = parseInt(hhmmssMatch[2], 10);
    const seconds = parseInt(hhmmssMatch[3], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  const mmssMatch = str.match(mmssRegex);
  if (mmssMatch) {
    const minutes = parseInt(mmssMatch[1], 10);
    const seconds = parseInt(mmssMatch[2], 10);
    return minutes * 60 + seconds;
  }

  throw new Error(
    `Invalid timestamp format: "${str}". Expected MM:SS (e.g., 01:20) or HH:MM:SS (e.g., 01:02:30)`
  );
}

module.exports = {
  parseTimestamp,
};
