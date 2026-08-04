import React, { useState } from 'react';
import './PromptInput.css';

export default function PromptInput({ onSend, isLoading }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
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
          placeholder="Ask a question about your research papers..."
          rows={1}
          disabled={isLoading}
        />
        <button
          id="chat-send-btn"
          type="submit"
          className="prompt-send-btn"
          disabled={!text.trim() || isLoading}
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
