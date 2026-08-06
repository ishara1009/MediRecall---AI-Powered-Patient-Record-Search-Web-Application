import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import './MainLayout.css';

const AUTH_ROUTES = ['/login', '/setup', '/forgot-password'];

export default function MainLayout({ children }) {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="main-layout">
      <Navbar />
      <div className={`layout-body ${isChatPage ? 'with-sidebar' : ''}`}>
        {isChatPage && <Sidebar />}
        <main className={`main-content ${isChatPage ? 'chat-main' : ''}`}>
          {children}
        </main>
      </div>
      {!isChatPage && <Footer />}
    </div>
  );
}
