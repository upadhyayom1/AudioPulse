/**
 * Audio service responsible for trimming audio files using FFmpeg.
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Set FFmpeg binary path from installer
if (ffmpegInstaller && ffmpegInstaller.path) {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

const TEMP_DIR = path.resolve(__dirname, '../temp');

/**
 * Trims an audio file to the specified time window and saves it as an MP3.
 * 
 * @param {string} inputPath - Absolute path to the source audio file
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds
 * @returns {Promise<string>} Absolute path to the trimmed MP3 file
 * @throws {Error} If inputs are invalid or FFmpeg processing fails
 */
function trimAudio(inputPath, startTime, endTime) {
  return new Promise((resolve, reject) => {
    // Validation
    if (!inputPath || typeof inputPath !== 'string') {
      return reject(new Error('Valid input audio path is required.'));
    }

    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input audio file does not exist at: ${inputPath}`));
    }

    if (typeof startTime !== 'number' || typeof endTime !== 'number') {
      return reject(new Error('Start and End times must be valid numbers (in seconds).'));
    }

    if (startTime < 0) {
      return reject(new Error('Start time cannot be negative.'));
    }

    if (endTime <= startTime) {
      return reject(new Error(`End time (${endTime}s) must be strictly greater than start time (${startTime}s).`));
    }

    const duration = endTime - startTime;
    const uniqueId = uuidv4();
    const outputPath = path.join(TEMP_DIR, `trimmed-${uniqueId}.mp3`);

    console.log(`[Audio Service] Trimming audio: ${inputPath} [${startTime}s -> ${endTime}s, duration: ${duration}s]`);

    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .audioBitrate(192)
      .on('start', (commandLine) => {
        console.log(`[Audio Service] Executing FFmpeg command: ${commandLine}`);
      })
      .on('end', () => {
        if (!fs.existsSync(outputPath)) {
          return reject(new Error('FFmpeg completed but output MP3 file was not found.'));
        }
        console.log(`[Audio Service] Trimming completed successfully: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('[Audio Service] FFmpeg error:', err.message || err);
        // Clean up partial output if created
        if (fs.existsSync(outputPath)) {
          try {
            fs.unlinkSync(outputPath);
          } catch (_) {}
        }
        reject(new Error(`Audio trimming failed: ${err.message || 'FFmpeg error'}`));
      })
      .save(outputPath);
  });
}

module.exports = {
  trimAudio,
};
