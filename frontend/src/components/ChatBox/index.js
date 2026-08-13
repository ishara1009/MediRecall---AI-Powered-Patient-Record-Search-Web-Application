import React, { useRef, useEffect } from 'react';
import ChatMessage from '../ChatMessage';
import TypingIndicator from '../TypingIndicator';
import './ChatBox.css';

export default function ChatBox({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="chatbox-empty">
        <div className="chatbox-empty-icon"></div>
        <h3 className="chatbox-empty-title">Review Patient Records</h3>
        <p className="chatbox-empty-subtitle">
          Ask questions about uploaded patient records and receive answers supported by those records.
        </p>
        <div className="chatbox-tips">
          <div className="tip-item">Ask about diagnoses, medications, results, or treatment history</div>
          <div className="tip-item">Select one record when reviewing a specific patient</div>
          <div className="tip-item">Supporting records and page numbers are provided</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbox" id="chat-message-list">
      <div className="chatbox-messages">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
