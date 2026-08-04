import React, { useState, useContext } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { sendChatMessage } from '../../api/api';
import ChatBox from '../../components/ChatBox';
import PromptInput from '../../components/PromptInput';
import './Chat.css';

export default function Chat() {
  const { messages, setMessages } = useContext(ChatContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (question) => {
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);
    try {
      const res = await sendChatMessage(question);
      const data = res.data;
      setMessages(prev => [...prev, { role: 'assistant', data }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        data: {
          question,
          answer: 'Failed to get a response. Please check that the backend and AI service are running.',
          confidence_score: 0,
          sources: [],
          context_references: []
        }
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="chat-page">
      <div className="chat-toolbar">
        <div className="chat-toolbar-left">
          <span className="chat-title">AI Research Chat</span>
          <span className="chat-count">{messages.length > 0 ? `${Math.floor(messages.length / 2)} question(s)` : 'Ready'}</span>
        </div>
        <button
          id="clear-chat-btn"
          className="clear-chat-btn"
          onClick={clearChat}
          disabled={messages.length === 0}
        >
          Clear Chat
        </button>
      </div>

      <ChatBox messages={messages} isLoading={isLoading} />

      <div className="chat-input-area">
        <PromptInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
