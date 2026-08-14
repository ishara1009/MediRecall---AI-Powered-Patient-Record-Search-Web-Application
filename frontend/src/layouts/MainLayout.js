import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import './MainLayout.css';

const AUTH_ROUTES = ['/login', '/signup', '/setup', '/forgot-password'];

export default function MainLayout({ children }) {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat' || location.pathname === '/doctor/chat';
  const hasChatSidebar = location.pathname === '/chat';
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="main-layout">
      <Navbar />
      <div className={`layout-body ${hasChatSidebar ? 'with-sidebar' : ''}`}>
        {hasChatSidebar && <Sidebar />}
        <main className={`main-content ${isChatPage ? 'chat-main' : ''} ${hasChatSidebar ? 'has-chat-sidebar' : ''}`}>
          {children}
        </main>
      </div>
      {!isChatPage && <Footer />}
    </div>
  );
}
