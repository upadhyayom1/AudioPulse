import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Download, Sparkles, Music } from 'lucide-react';
import AudioForm from './components/AudioForm';
import ProgressMessage from './components/ProgressMessage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function App() {
  const [url, setUrl] = useState('');
  const [start, setStart] = useState('00:00');
  const [end, setEnd] = useState('00:30');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);

  const prevBlobUrlRef = useRef(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (prevBlobUrlRef.current) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
    };
  }, []);

  const handleTrimAudio = async () => {
    // 1. Reset state
    setErrorMessage('');
    setStatusMessage('Preparing audio...');

    if (prevBlobUrlRef.current) {
      URL.revokeObjectURL(prevBlobUrlRef.current);
      prevBlobUrlRef.current = null;
      setAudioBlobUrl(null);
    }

    // 2. Client-side input validation
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrorMessage('Please enter a YouTube video URL.');
      return;
    }

    if (!start.trim() || !end.trim()) {
      setErrorMessage('Please provide both start and end timestamps.');
      return;
    }

    setIsLoading(true);

    // Timed simulated stage feedback while processing
    const timer1 = setTimeout(() => {
      setStatusMessage('Downloading audio stream...');
    }, 1500);

    const timer2 = setTimeout(() => {
      setStatusMessage('Trimming audio with FFmpeg...');
    }, 4500);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/audio/trim`,
        {
          url: trimmedUrl,
          start: start.trim(),
          end: end.trim(),
        },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      clearTimeout(timer1);
      clearTimeout(timer2);

      // Check if response returned an error blob (e.g. 400 or 500 JSON sent as blob)
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.error || 'Server error while processing audio.');
      }

      // Create downloadable / playable object URL
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const newBlobUrl = URL.createObjectURL(blob);
      prevBlobUrlRef.current = newBlobUrl;
      setAudioBlobUrl(newBlobUrl);
      setStatusMessage('');
    } catch (error) {
      clearTimeout(timer1);
      clearTimeout(timer2);

      let msg = 'Failed to process audio. Please check the YouTube URL and timestamps.';

      if (error.response && error.response.data) {
        if (error.response.data instanceof Blob) {
          try {
            const errorText = await error.response.data.text();
            const parsed = JSON.parse(errorText);
            msg = parsed.error || msg;
          } catch {
            // keep fallback msg
          }
        } else if (error.response.data.error) {
          msg = error.response.data.error;
        }
      } else if (error.message) {
        msg = error.message;
      }

      setErrorMessage(msg);
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      <main className="app-container">
        <div className="trimmer-card">
          {/* Header */}
          <header className="card-header">
            <div className="brand-badge">
              <Sparkles size={14} />
              <span>Fast & High Quality</span>
            </div>
            <h1 className="card-title">AudioPulse</h1>
            <p className="card-subtitle">
              Paste a YouTube link and select the portion you want to extract.
            </p>
          </header>

          {/* Form */}
          <AudioForm
            url={url}
            setUrl={setUrl}
            start={start}
            setStart={setStart}
            end={end}
            setEnd={setEnd}
            isLoading={isLoading}
            onSubmit={handleTrimAudio}
          />

          {/* Progress & Error Feedback */}
          <ProgressMessage
            status={statusMessage}
            error={errorMessage}
            isSuccess={!isLoading && !errorMessage && Boolean(audioBlobUrl)}
          />

          {/* Download & Preview Section */}
          {audioBlobUrl && (
            <section className="audio-preview-section" aria-label="Trimmed Audio Preview">
              <div className="audio-preview-title">
                <Music size={16} color="#10b981" />
                <span>Audio Preview & Download</span>
              </div>

              {/* In-browser Player */}
              <audio
                controls
                src={audioBlobUrl}
                className="audio-player-custom"
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>

              {/* Download Button */}
              <a
                id="download-btn"
                href={audioBlobUrl}
                download="trimmed-audio.mp3"
                className="btn-primary btn-download"
                style={{ textDecoration: 'none' }}
              >
                <Download size={20} />
                <span>Download Trimmed Audio (MP3)</span>
              </a>
            </section>
          )}

          {/* Educational Disclaimer */}
          <footer className="card-footer">
            <p>
              Educational & Personal Use Only. Please ensure you are authorized to download and process the selected media.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
