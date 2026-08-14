import React from 'react';
import AnswerCard from '../AnswerCard';
import './ChatMessage.css';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'ai-message'}`}>
      {isUser ? (
        <div className="user-bubble">
          <p className="user-text">{message.content}</p>
        </div>
      ) : (
        <div className="ai-response">
          <div className="ai-content">
            <AnswerCard data={message.data} />
          </div>
        </div>
      )}
    </div>
  );
}
