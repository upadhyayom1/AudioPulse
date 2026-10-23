/**
 * Audio routes definition.
 */

const express = require('express');
const { trimYouTubeAudio } = require('../controllers/audio.controller');

const router = express.Router();

// POST /api/audio/trim
router.post('/trim', trimYouTubeAudio);

module.exports = router;
