import React, { useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatContext } from '../../context/ChatContext';
import { getDoctorPatients, getDocuments, sendChatMessage } from '../../api/api';
import ChatBox from '../../components/ChatBox';
import PromptInput from '../../components/PromptInput';
import './Chat.css';

export default function Chat() {
  const location = useLocation();
  const { messages, setMessages } = useContext(ChatContext);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(location.state?.patientId || '');
  const [documentId, setDocumentId] = useState(location.state?.documentId || 'all');

  useEffect(() => {
    getDocuments()
      .then((res) => setDocuments(res.data || []))
      .catch(() => setDocuments([]));
    getDoctorPatients().then((res) => setPatients(res.data || [])).catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    if (!patientId || documentId !== 'all') return;
    const firstRecord = documents.find((doc) => doc.patientId === patientId && (!doc.processingStatus || doc.processingStatus === 'READY'));
    if (firstRecord) setDocumentId(firstRecord.customId);
  }, [documents, patientId, documentId]);

  const handleSend = async (question) => {
    if (!patientId) return;
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);
    try {
      const res = await sendChatMessage(question, documentId, patientId);
      const data = { ...res.data, showRetrievedContext: documentId !== 'all' };
      setMessages(prev => [...prev, { role: 'assistant', data }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        data: {
          question,
          answer: err.response?.data?.message || err.response?.data?.error || 'Failed to get a response. Please check that the backend and AI service are running.',
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
          <span>Patient</span>
          <select value={patientId} onChange={(e) => {
            const selectedPatientId = e.target.value;
            const firstRecord = documents.find((doc) => doc.patientId === selectedPatientId && (!doc.processingStatus || doc.processingStatus === 'READY'));
            setPatientId(selectedPatientId);
            setDocumentId(firstRecord?.customId || 'all');
            clearChat();
          }} disabled={isLoading}>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient._id} value={patient.patientId}>{patient.patientId} · {patient.fullName}</option>)}
          </select>
          <span>Records</span>
          <select value={documentId} onChange={(e) => { setDocumentId(e.target.value); clearChat(); }} disabled={isLoading || !patientId}>
            <option value="all">{patientId ? 'All ready patient records' : 'Select a patient first'}</option>
            {documents.filter((doc) => doc.patientId === patientId && (!doc.processingStatus || doc.processingStatus === 'READY')).map((doc) => (
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
        {!patientId && <p className="document-required-message">Select a patient before asking the clinical assistant.</p>}
        <PromptInput onSend={handleSend} isLoading={isLoading || !patientId} />
      </div>
    </div>
  );
}
