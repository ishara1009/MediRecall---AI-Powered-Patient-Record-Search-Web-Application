import React, { useState } from 'react';
import './PromptInput.css';

export default function PromptInput({ onSend, isLoading, disabled = false }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <div className="prompt-wrapper">
        <textarea
          id="chat-prompt-input"
          className="prompt-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the selected patient records..."
          rows={1}
          disabled={isLoading || disabled}
        />
        <button
          id="chat-send-btn"
          type="submit"
          className="prompt-send-btn"
          disabled={!text.trim() || isLoading || disabled}
        >
          {isLoading ? (
            <span className="send-spinner"></span>
          ) : (
            <span>↑</span>
          )}
        </button>
      </div>
      <p className="prompt-hint">Press Enter to send · Shift+Enter for new line</p>
    </form>
  );
}
