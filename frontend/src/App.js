import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import MainLayout from './layouts/MainLayout';
import AppRoutes from './routes/AppRoutes';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <Router>
      <ChatProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </ChatProvider>
    </Router>
  );
}

export default App;
