import React from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Component to display current processing stage or error/success message.
 */
export default function ProgressMessage({ status, error, isSuccess }) {
  if (error) {
    return (
      <div className="status-box status-error" role="alert">
        <AlertCircle size={20} style={{ flexShrink: 0 }} />
        <span>{error}</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="status-box status-success">
        <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
        <span>Done! Your trimmed audio is ready.</span>
      </div>
    );
  }

  if (status) {
    return (
      <div className="status-box status-loading">
        <Loader2 size={20} className="spinner" style={{ flexShrink: 0 }} />
        <span>{status}</span>
      </div>
    );
  }

  return null;
}
