/**
 * Audio controller handling audio trimming endpoints.
 */

const fs = require('fs');
const { parseTimestamp } = require('../utils/time.utils');
const { getYouTubeAudio } = require('../services/youtube.service');
const { trimAudio } = require('../services/audio.service');

/**
 * Safely removes a file from the filesystem if it exists.
 * 
 * @param {string} filePath - Path to file to delete
 */
function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`[Audio Controller] Cleaned up temporary file: ${filePath}`);
    } catch (err) {
      console.error(`[Audio Controller] Error cleaning up file ${filePath}:`, err.message);
    }
  }
}

/**
 * Controller for trimming audio from a YouTube video URL.
 * 
 * Request body:
 * {
 *   "url": "https://www.youtube.com/watch?v=...",
 *   "start": "01:20",
 *   "end": "01:45"
 * }
 */
async function trimYouTubeAudio(req, res) {
  let sourceFilePath = null;
  let trimmedFilePath = null;

  try {
    const { url, start, end } = req.body || {};

    // 1. Validate request body presence
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'YouTube URL is required.' });
    }

    if (start === undefined || start === null || String(start).trim() === '') {
      return res.status(400).json({ error: 'Start timestamp is required.' });
    }

    if (end === undefined || end === null || String(end).trim() === '') {
      return res.status(400).json({ error: 'End timestamp is required.' });
    }

    // 2. Parse start and end timestamps
    let startSeconds;
    let endSeconds;

    try {
      startSeconds = parseTimestamp(start);
    } catch (err) {
      return res.status(400).json({ error: `Start time error: ${err.message}` });
    }

    try {
      endSeconds = parseTimestamp(end);
    } catch (err) {
      return res.status(400).json({ error: `End time error: ${err.message}` });
    }

    // 3. Validate timestamp range
    if (endSeconds <= startSeconds) {
      return res.status(400).json({
        error: `End time (${end}) must be strictly after start time (${start}).`
      });
    }

    console.log(`[Audio Controller] Processing trim request: URL=${url}, start=${startSeconds}s, end=${endSeconds}s`);

    // 4. Download source audio
    sourceFilePath = await getYouTubeAudio(url);

    // 5. Trim audio with FFmpeg
    trimmedFilePath = await trimAudio(sourceFilePath, startSeconds, endSeconds);

    // 6. Send trimmed MP3 file
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="trimmed-audio.mp3"');

    // Clean up temporary files once response completes or closes
    const onFinishOrClose = () => {
      cleanupFile(sourceFilePath);
      cleanupFile(trimmedFilePath);
      res.removeListener('finish', onFinishOrClose);
      res.removeListener('close', onFinishOrClose);
    };

    res.on('finish', onFinishOrClose);
    res.on('close', onFinishOrClose);

    return res.sendFile(trimmedFilePath, (err) => {
      if (err) {
        console.error('[Audio Controller] Error sending file response:', err.message);
        cleanupFile(sourceFilePath);
        cleanupFile(trimmedFilePath);
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Failed to stream audio file to client.' });
        }
      }
    });

  } catch (error) {
    console.error('[Audio Controller] Error handling trim request:', error.message || error);

    // Clean up temporary files on error
    cleanupFile(sourceFilePath);
    cleanupFile(trimmedFilePath);

    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message || 'An unexpected error occurred while processing the audio.'
      });
    }
  }
}

module.exports = {
  trimYouTubeAudio,
};
