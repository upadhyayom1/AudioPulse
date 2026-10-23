import React from 'react';
import { Youtube, Clock, Scissors, Loader2 } from 'lucide-react';

/**
 * Form component to accept YouTube URL, Start Time, and End Time.
 */
export default function AudioForm({
  url,
  setUrl,
  start,
  setStart,
  end,
  setEnd,
  isLoading,
  onSubmit,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="trimmer-form" onSubmit={handleSubmit}>
      {/* YouTube URL Input */}
      <div className="form-group">
        <label htmlFor="youtube-url" className="form-label">
          <Youtube size={16} color="#f43f5e" />
          YouTube URL
        </label>
        <div className="input-wrapper">
          <span className="input-icon">
            <Youtube size={18} />
          </span>
          <input
            id="youtube-url"
            type="text"
            className="text-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>

      {/* Start & End Timestamps */}
      <div className="time-grid">
        {/* Start Time */}
        <div className="form-group">
          <label htmlFor="start-time" className="form-label">
            <Clock size={16} color="#6366f1" />
            Start Time
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <Clock size={18} />
            </span>
            <input
              id="start-time"
              type="text"
              className="text-input time-input"
              placeholder="00:00"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <span className="input-hint">Format: MM:SS or HH:MM:SS</span>
        </div>

        {/* End Time */}
        <div className="form-group">
          <label htmlFor="end-time" className="form-label">
            <Clock size={16} color="#d946ef" />
            End Time
          </label>
          <div className="input-wrapper">
            <span className="input-icon">
              <Clock size={18} />
            </span>
            <input
              id="end-time"
              type="text"
              className="text-input time-input"
              placeholder="00:30"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <span className="input-hint">Format: MM:SS or HH:MM:SS</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        id="trim-btn"
        type="submit"
        className="btn-primary"
        disabled={isLoading || !url.trim() || !start.trim() || !end.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="spinner" />
            <span>Processing Audio...</span>
          </>
        ) : (
          <>
            <Scissors size={20} />
            <span>Trim Audio</span>
          </>
        )}
      </button>
    </form>
  );
}
