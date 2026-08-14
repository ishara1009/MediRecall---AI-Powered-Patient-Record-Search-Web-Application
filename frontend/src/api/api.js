import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 60000,
});

// Axios Request Interceptor to attach JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Health Check API
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// ==========================================
// 1. Authentication APIs
// ==========================================

// Check if first administrator exists
export const getSetupStatus = async () => {
  const response = await apiClient.get('/auth/setup-status');
  return response.data;
};

// Register first administrative user
export const setupAdmin = async (formData) => {
  const response = await apiClient.post('/auth/setup-admin', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Register a regular person account
export const signupUser = async (formData) => {
  const response = await apiClient.post('/auth/signup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Perform login
export const loginUser = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

// Forgot Password - Credential validated password reset
export const forgotPassword = async (payload) => {
  const response = await apiClient.post('/auth/forgot-password', payload);
  return response.data;
};

// Get current session data
export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// Update active profile details
export const updateProfile = async (formData) => {
  const response = await apiClient.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Change active user password (regular or forced reset)
export const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
  const response = await apiClient.put('/auth/change-password', {
    currentPassword,
    newPassword,
    confirmNewPassword
  });
  return response.data;
};

// Logout session
export const logoutUser = async () => {
  try {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  } catch (error) {
    // Return mock success so cleanup operates client-side regardless
    return { success: true };
  }
};
export const getNotifications = async () => (await apiClient.get('/notifications')).data;
export const markNotificationRead = async (id) => (await apiClient.patch(`/notifications/${id}/read`)).data;
export const markAllNotificationsRead = async () => (await apiClient.patch('/notifications/read-all')).data;


// ==========================================
// 2. Admin Operations APIs
// ==========================================

// Create Doctor account
export const createDoctor = async (formData) => {
  const response = await apiClient.post('/admin/doctors', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Retrieve all doctor records
export const getDoctors = async () => {
  const response = await apiClient.get('/admin/doctors');
  return response.data;
};

// Update Doctor account
export const updateDoctor = async (id, formData) => {
  const response = await apiClient.put(`/admin/doctors/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Delete Doctor account
export const deleteDoctor = async (id) => {
  const response = await apiClient.delete(`/admin/doctors/${id}`);
  return response.data;
};

// Toggle active status
export const toggleDoctorStatus = async (id, status) => {
  const response = await apiClient.patch(`/admin/doctors/${id}/status`, { status });
  return response.data;
};

// Admin reset Doctor's temporary password
export const resetDoctorPassword = async (id, temporaryPassword) => {
  const response = await apiClient.post(`/admin/doctors/${id}/reset-password`, { temporaryPassword });
  return response.data;
};

// Retrieve Admin system statistics
export const getAdminStats = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

// Retrieve system logs
export const getSystemLogs = async () => {
  const response = await apiClient.get('/admin/logs');
  return response.data;
};


// ==========================================
// 3. Doctor Operations APIs
// ==========================================

// Log a search query
export const logSearchQuery = async (query, resultsCount) => {
  const response = await apiClient.post('/doctor/search-history', { query, resultsCount });
  return response.data;
};

// Retrieve search logs
export const getSearchHistory = async () => {
  const response = await apiClient.get('/doctor/search-history');
  return response.data;
};

// Fetch chat sessions
export const getChatSessions = async () => {
  const response = await apiClient.get('/doctor/chat-sessions');
  return response.data;
};

// Start chat session
export const createChatSession = async (title) => {
  const response = await apiClient.post('/doctor/chat-sessions', { title });
  return response.data;
};

// Fetch messages inside session
export const getChatSessionDetails = async (id) => {
  const response = await apiClient.get(`/doctor/chat-sessions/${id}`);
  return response.data;
};

// Record QA message exchange
export const addMessageToSession = async (id, question, answer) => {
  const response = await apiClient.post(`/doctor/chat-sessions/${id}/messages`, { question, answer });
  return response.data;
};

// Delete chat session
export const deleteChatSession = async (id) => {
  const response = await apiClient.delete(`/doctor/chat-sessions/${id}`);
  return response.data;
};

// Retrieve Doctor Dashboard statistics
export const getDoctorStats = async () => {
  const response = await apiClient.get('/doctor/stats');
  return response.data;
};
export const getDoctorAppointments = async () => (await apiClient.get('/doctor/appointments')).data;
export const updateDoctorAppointmentStatus = async (id, status) => (await apiClient.patch(`/doctor/appointments/${id}/status`, { status })).data;
export const getDoctorAvailability = async () => (await apiClient.get('/doctor/availability')).data;
export const saveDoctorAvailability = async (schedule) => (await apiClient.put('/doctor/availability', { schedule })).data;
export const addDoctorBlockedDate = async (payload) => (await apiClient.post('/doctor/availability/blocked-dates', payload)).data;
export const deleteDoctorBlockedDate = async (id) => (await apiClient.delete(`/doctor/availability/blocked-dates/${id}`)).data;

export const getDoctorPatients = async () => {
  const response = await apiClient.get('/doctor/patients');
  return response.data;
};

export const getAdminPatients = async () => {
  const response = await apiClient.get('/admin/patients');
  return response.data;
};

export const getPatientWorkspace = async (patientId) => {
  const response = await apiClient.get(`/doctor/patients/${patientId}`);
  return response.data;
};

export const addPatientCondition = async (patientId, payload) => (await apiClient.post(`/doctor/patients/${patientId}/conditions`, payload)).data;
export const addPatientAllergy = async (patientId, payload) => (await apiClient.post(`/doctor/patients/${patientId}/allergies`, payload)).data;
export const addPatientMedication = async (patientId, payload) => (await apiClient.post(`/doctor/patients/${patientId}/medications`, payload)).data;
export const addPatientConsultation = async (patientId, payload) => (await apiClient.post(`/doctor/patients/${patientId}/consultations`, payload)).data;

// Read-only physician directory for personal users
export const getUserDoctors = async () => {
  const response = await apiClient.get('/user/doctors');
  return response.data;
};

export const getUserDoctor = async (doctorId) => {
  const response = await apiClient.get(`/user/doctors/${doctorId}`);
  return response.data;
};

export const getAvailableAppointmentSlots = async (doctorId, date) => {
  const response = await apiClient.get('/user/appointments/available-slots', { params: { doctorId, date } });
  return response.data;
};

export const createAppointment = async (payload) => {
  const response = await apiClient.post('/user/appointments', payload);
  return response.data;
};

export const getMyAppointments = async () => {
  const response = await apiClient.get('/user/appointments');
  return response.data;
};
export const getMyMedicalRecords = async () => (await apiClient.get('/user/records')).data;
export const getMyMedicalRecordPdf = async (id) => (await apiClient.get(`/user/records/${id}/file`, { responseType: 'blob' })).data;
export const getMyPatientProfile = async () => (await apiClient.get('/user/patient-profile')).data;
export const updateMyPatientProfile = async (payload) => (await apiClient.put('/user/patient-profile', payload)).data;

export const cancelMyAppointment = async (id) => {
  const response = await apiClient.patch(`/user/appointments/${id}/cancel`);
  return response.data;
};


// ==========================================
// 4. Ingested Documents APIs
// ==========================================

// Ingest multiple PDFs (Admin only)
export const uploadDocuments = async (files, patient, onUploadProgress) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('patientName', patient.name);
  formData.append('patientId', patient.id);
  formData.append('diseases', patient.diseases);
  formData.append('documentType', patient.documentType || 'OTHER');
  formData.append('recordDate', patient.recordDate || new Date().toISOString().slice(0, 10));
  if (patient.photo) formData.append('patientPhoto', patient.photo);
  if (patient.pdf) formData.append('pdf', patient.pdf);
  const response = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

// Query RAG chain (Doctor only)
export const sendChatMessage = async (question, documentId, patientId) => {
  const response = await apiClient.post('/chat', {
    question,
    documentId: documentId === 'all' ? null : documentId,
    patientId
  });
  return response.data;
};

// List all ingested documents (Shared)
export const getDocuments = async () => {
  const response = await apiClient.get('/documents');
  return response.data;
};
export const getDocumentPdf = async (id) => (await apiClient.get(`/documents/${id}/file`, { responseType: 'blob' })).data;

// Delete metadata + index (Admin only)
export const deleteDocument = async (id) => {
  const response = await apiClient.delete(`/documents/${id}`);
  return response.data;
};

export const updateDocumentPatient = async (id, patient) => {
  const formData = new FormData();
  formData.append('patientName', patient.name);
  formData.append('patientId', patient.id);
  formData.append('diseases', patient.diseases);
  if (patient.photo) formData.append('patientPhoto', patient.photo);
  const response = await apiClient.put(`/documents/${id}/patient`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// Rebuild index for single doc (Admin only)
export const rebuildDocument = async (id) => {
  const response = await apiClient.post(`/documents/${id}/rebuild`);
  return response.data;
};

// Rebuild index for all docs (Admin only)
export const rebuildAllDocuments = async () => {
  const response = await apiClient.post('/documents/rebuild-all');
  return response.data;
};
