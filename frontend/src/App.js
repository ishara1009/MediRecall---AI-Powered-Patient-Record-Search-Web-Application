import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes/AppRoutes';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

