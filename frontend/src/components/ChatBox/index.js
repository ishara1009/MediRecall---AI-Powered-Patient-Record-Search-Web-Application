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
        <h3 className="chatbox-empty-title">Ask About Your Research</h3>
        <p className="chatbox-empty-subtitle">
          Upload research papers and ask questions. The AI will answer strictly from the uploaded documents.
        </p>
        <div className="chatbox-tips">
          <div className="tip-item">Ask specific questions about methods or findings</div>
          <div className="tip-item">Cite exact terms from the paper for accuracy</div>
          <div className="tip-item">Sources and page numbers are always cited</div>
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
