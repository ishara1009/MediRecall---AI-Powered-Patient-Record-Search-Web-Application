import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Upload from '../pages/Upload/Upload';
import Chat from '../pages/Chat/Chat';
import About from '../pages/About/About';
import Documents from '../pages/Documents/Documents';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}
