import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 60000,
});

// Upload multiple PDFs
export const uploadDocuments = async (files, onUploadProgress) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const response = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

// Ask a question
export const sendChatMessage = async (question) => {
  const response = await apiClient.post('/chat', { question });
  return response.data;
};

// List all documents
export const getDocuments = async () => {
  const response = await apiClient.get('/documents');
  return response.data;
};

// Delete a document
export const deleteDocument = async (id) => {
  const response = await apiClient.delete(`/documents/${id}`);
  return response.data;
};

// Rebuild embeddings for single document
export const rebuildDocument = async (id) => {
  const response = await apiClient.post(`/documents/${id}/rebuild`);
  return response.data;
};

// Rebuild all embeddings
export const rebuildAllDocuments = async () => {
  const response = await apiClient.post('/documents/rebuild-all');
  return response.data;
};

// Health check
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};
