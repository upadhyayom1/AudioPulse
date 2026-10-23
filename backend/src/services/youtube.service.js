/**
 * YouTube service responsible for validating YouTube URLs
 * and extracting the audio stream to a temporary local file.
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const YtDlpWrap = require('yt-dlp-wrap').default;

const TEMP_DIR = path.resolve(__dirname, '../temp');
const BIN_PATH = path.join(TEMP_DIR, 'yt-dlp');

let ytDlpInstance = null;
let initPromise = null;

/**
 * Validates whether a given URL is a valid and supported YouTube video URL.
 * 
 * Supports:
 * - https://www.youtube.com/watch?v=...
 * - https://youtube.com/watch?v=...
 * - https://m.youtube.com/watch?v=...
 * - https://youtu.be/...
 * - https://www.youtube.com/shorts/...
 * - https://youtube.com/shorts/...
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid YouTube URL
 */
function isValidYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();
  const youtubeRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?(?:.*&)?v=|shorts\/|v\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})([^\s]*)$/;
  return youtubeRegex.test(trimmed);
}

/**
 * Initializes and returns a ready-to-use YtDlpWrap instance.
 * Automatically downloads the latest binary if not present locally.
 * 
 * @returns {Promise<YtDlpWrap>}
 */
async function getYtDlpInstance() {
  if (ytDlpInstance) {
    return ytDlpInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Check if binary exists
    if (!fs.existsSync(BIN_PATH)) {
      console.log(`[YouTube Service] Downloading yt-dlp binary to: ${BIN_PATH}`);
      await YtDlpWrap.downloadFromGithub(BIN_PATH);
      fs.chmodSync(BIN_PATH, 0o755);
      console.log('[YouTube Service] yt-dlp binary downloaded and permissions set.');
    }

    ytDlpInstance = new YtDlpWrap(BIN_PATH);
    return ytDlpInstance;
  })();

  return initPromise;
}

/**
 * Downloads audio stream for an authorized YouTube URL into backend/src/temp/.
 * 
 * @param {string} url - YouTube URL to download
 * @returns {Promise<string>} The absolute path to the downloaded source file
 * @throws {Error} If URL is invalid or download fails
 */
async function getYouTubeAudio(url) {
  if (!isValidYouTubeUrl(url)) {
    throw new Error('Invalid YouTube URL provided. Please provide a valid YouTube video or Shorts link.');
  }

  const ytDlp = await getYtDlpInstance();
  const uniqueId = uuidv4();
  const outputTemplate = path.join(TEMP_DIR, `source-${uniqueId}.%(ext)s`);

  console.log(`[YouTube Service] Starting audio download for: ${url}`);

  try {
    const stdout = await ytDlp.execPromise([
      url.trim(),
      '--no-check-certificate',
      '--extractor-args', 'youtube:player_client=android,web',
      '--js-runtimes', 'node',
      '-f', 'ba/b', // best audio stream
      '-o', outputTemplate,
      '--no-playlist',
      '--print', 'after_move:filepath'
    ]);

    // Find downloaded file path from yt-dlp stdout
    const outputLines = stdout.trim().split('\n');
    let downloadedPath = outputLines[outputLines.length - 1].trim();

    if (!fs.existsSync(downloadedPath)) {
      // Fallback check in temp dir matching uniqueId prefix
      const files = fs.readdirSync(TEMP_DIR);
      const matched = files.find(f => f.startsWith(`source-${uniqueId}`));
      if (matched) {
        downloadedPath = path.join(TEMP_DIR, matched);
      } else {
        throw new Error('Downloaded audio file could not be located in temporary directory.');
      }
    }

    console.log(`[YouTube Service] Downloaded successfully to: ${downloadedPath}`);
    return downloadedPath;
  } catch (error) {
    console.error('[YouTube Service] Extraction failed:', error.message || error);
    throw new Error(`Failed to extract audio from YouTube: ${error.message || 'Media extraction error'}`);
  }
}

module.exports = {
  isValidYouTubeUrl,
  getYouTubeAudio,
};
