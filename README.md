# 🎵 AudioPulse

A simple, robust, full-stack educational web application that extracts and trims authorized audio from YouTube videos into MP3 files using Node.js, Express, FFmpeg, and React with Vite.

---

## 📖 1. Project Purpose

This project is built for **educational and personal use**. It provides a clean, user-friendly interface to:
1. Input a YouTube URL and specify start and end timestamps.
2. Download and extract the media stream to a temporary location.
3. Precisely trim the desired segment using FFmpeg.
4. Stream the resulting MP3 audio file back to the browser for instant playback and download.
5. Automatically clean up all temporary files on the server to prevent disk clutter.

> **Disclaimer**: This tool is designed strictly for educational purposes and personal workflows. Users must only process and download audio from media they own or are explicitly authorized to use (e.g., Creative Commons, public domain, or user-owned content).

---

## 📁 2. Folder Structure

```
audiopulse/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── audio.controller.js  # Request validation, pipeline orchestration, & file streaming
│   │   ├── routes/
│   │   │   └── audio.routes.js      # Express route definitions
│   │   ├── services/
│   │   │   ├── youtube.service.js   # YouTube URL validation & media stream extraction
│   │   │   └── audio.service.js     # FFmpeg audio trimming & MP3 encoding
│   │   ├── utils/
│   │   │   └── time.utils.js        # Timestamp parsing & validation (MM:SS, HH:MM:SS)
│   │   ├── temp/
│   │   │   └── .gitkeep             # Temporary storage directory for in-flight audio files
│   │   └── server.js                # Express app initialization, CORS, & middleware
│   ├── test/
│   │   ├── test_pipeline.js         # Unit tests for time utils & URL validation
│   │   └── test_api.js              # Integration tests for API endpoints
│   ├── .env                         # Backend environment configuration
│   ├── .gitignore                   # Backend Git ignore rules
│   └── package.json                 # Backend dependencies & npm scripts
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioForm.jsx        # URL input, timestamp fields, & trim action button
│   │   │   └── ProgressMessage.jsx  # Status indicators (loading, errors, success)
│   │   ├── App.jsx                  # Main application state, audio player, & download handler
│   │   ├── main.jsx                 # React root mount
│   │   └── index.css                # Polished modern dark aesthetic design system
│   ├── index.html                   # HTML template with Google Fonts
│   ├── .env                         # Frontend environment configuration
│   ├── .gitignore                   # Frontend Git ignore rules
│   ├── package.json                 # Frontend dependencies & npm scripts
│   └── vite.config.js               # Vite bundler configuration
│
├── README.md                        # Documentation and project manual
└── .gitignore                       # Project-level Git ignore rules
```

---

## ⚙️ 3. Prerequisites

Before running the application, make sure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or later (tested on Node `v24.x`)
- **npm**: `v9.0.0` or later

---

## 📦 4. Installing Node.js Dependencies

### Backend Dependencies
Navigate to the `backend/` folder and run:
```bash
cd backend
npm install
```

### Frontend Dependencies
Navigate to the `frontend/` folder and run:
```bash
cd frontend
npm install
```

---

## 🎬 5. FFmpeg & Media Extractor

- **FFmpeg**: The backend utilizes `@ffmpeg-installer/ffmpeg` and `fluent-ffmpeg`, which automatically bundles a cross-platform static binary for macOS, Linux, and Windows. No manual system installation of FFmpeg is required.
- **Media Extraction**: The backend automatically handles and caches the `yt-dlp` extractor binary inside `backend/src/temp/` on first run.

---

## 🔧 6. Backend Setup

1. Check or create `backend/.env`:
   ```env
   PORT=5001
   ```
2. Verify tests:
   ```bash
   cd backend
   npm test
   ```

---

## 💻 7. Frontend Setup

1. Check or create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5001
   ```

---

## 🚀 8. Running the Application

### Option A: Running Backend and Frontend Simultaneously

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *The backend will be available at `http://localhost:5001`.*

2. **Start the Frontend Development Server** (in a second terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

3. Open `http://localhost:5173` in your web browser.

---

## 🔌 9. API Endpoint

### `POST /api/audio/trim`

Trims a specified segment from a YouTube video and streams back the trimmed MP3 file.

#### Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "start": "00:10",
  "end": "00:25"
}
```

#### Response
- **Status 200**: Binary MP3 audio stream (`Content-Type: audio/mpeg`, `Content-Disposition: attachment; filename="trimmed-audio.mp3"`).
- **Status 400**: Invalid input or validation failure (`{ "error": "..." }`).
- **Status 500**: Processing or extraction error (`{ "error": "..." }`).

---

## ⏱️ 10. How Timestamp Parsing Works

The utility `time.utils.js` converts timestamp strings into total integer seconds:

| Input | Parsed Seconds | Description |
| :--- | :--- | :--- |
| `"00:30"` | `30` | 0 minutes, 30 seconds |
| `"01:20"` | `80` | 1 minute, 20 seconds |
| `"02:30"` | `150` | 2 minutes, 30 seconds |
| `"01:02:30"` | `3750` | 1 hour, 2 minutes, 30 seconds |
| `"45"` | `45` | Direct seconds string |

**Validation Rules:**
- Negative timestamps (`"-01:20"`) are strictly rejected.
- End time must be strictly greater than start time (`end > start`).
- Seconds and minutes within formatted timestamps must be valid numbers (`0-59`).

---

## 🔄 11. How the Processing Pipeline Works

```
User Form Submit (React)
           │
           ▼
POST /api/audio/trim (Express)
           │
           ▼
[audio.controller.js]
  1. Validates presence of url, start, and end
  2. Parses & verifies timestamps via [time.utils.js]
           │
           ▼
[youtube.service.js]
  3. Validates YouTube URL pattern
  4. Downloads audio stream to temporary file: backend/src/temp/source-<uuid>.mp4
           │
           ▼
[audio.service.js]
  5. Trims segment using FFmpeg: -ss <start> -t <duration> -acodec libmp3lame
  6. Encodes output to: backend/src/temp/trimmed-<uuid>.mp3
           │
           ▼
[audio.controller.js]
  7. Streams trimmed MP3 file to client
  8. Deletes both source and trimmed temporary files on finish / close / error
           │
           ▼
Browser (React Frontend)
  9. Creates Object URL via URL.createObjectURL(blob)
 10. Renders in-browser audio player & "Download Trimmed Audio" button
```

---

## 🔒 12. Security & Temporary File Management

- **No Command Injection**: All external tool parameters are passed as structured arrays of arguments rather than executing raw shell strings.
- **Unique File Names**: All temporary files use UUIDs (`source-<uuid>.*`, `trimmed-<uuid>.mp3`) to prevent file name collisions across concurrent requests.
- **Guaranteed Cleanup**: Temporary files are deleted immediately after the response finishes streaming or whenever an error occurs.
- **Clean Error Messages**: Internal filesystem paths and stack traces are excluded from API client responses.

---

## 📜 13. License

This project is licensed under the MIT License for educational purposes.
