import { api } from './api';

export const ragApi = {
  uploadFile: (formData) => fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/upload`, {
    method: 'POST',
    body: formData
  }).then((res) => res.json()),
  chat: (payload) => api.post('/chat', payload)
};
