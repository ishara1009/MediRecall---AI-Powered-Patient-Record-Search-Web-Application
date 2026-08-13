import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatContext } from '../../context/ChatContext';
import { getDocuments, sendChatMessage } from '../../api/api';
import ChatBox from '../../components/ChatBox';
import PromptInput from '../../components/PromptInput';
import './Chat.css';

export default function Chat() {
  const location = useLocation();
  const { messages, setMessages } = useContext(ChatContext);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentId, setDocumentId] = useState(location.state?.documentId || 'all');

  useEffect(() => {
    getDocuments()
      .then((res) => setDocuments(res.data || []))
      .catch(() => setDocuments([]));
  }, []);

  const handleSend = async (question) => {
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);
    try {
      const res = await sendChatMessage(question, documentId);
      const data = { ...res.data, showRetrievedContext: documentId !== 'all' };
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
          <span className="chat-title">Patient Record Assistant</span>
          <span className="chat-count">{messages.length > 0 ? `${Math.floor(messages.length / 2)} question(s)` : 'Ready'}</span>
        </div>
        <label className="chat-document-picker">
          <span>Chat scope</span>
          <select value={documentId} onChange={(e) => { setDocumentId(e.target.value); clearChat(); }} disabled={isLoading}>
            <option value="all">All uploaded PDFs</option>
            {documents.map((doc) => (
              <option key={doc._id} value={doc.customId}>{doc.filename}</option>
            ))}
          </select>
        </label>
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
