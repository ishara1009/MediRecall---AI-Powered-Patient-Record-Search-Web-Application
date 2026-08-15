import React from 'react';
import './TypingIndicator.css';

export default function TypingIndicator() {
  return (
    <div className="typing-indicator" role="status" aria-live="polite">
      <div className="typing-avatar" aria-hidden="true"><span className="typing-orbit"></span></div>
      <div className="typing-bubble">
        <div className="typing-copy">
          <strong>Reviewing patient records</strong>
          <span>Finding relevant clinical context</span>
        </div>
        <div className="typing-dots" aria-hidden="true"><span></span><span></span><span></span></div>
      </div>
    </div>
  );
}
