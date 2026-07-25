import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Logs from './pages/Logs.jsx';
import Stats from './pages/Stats.jsx';
import Friends from './pages/Friends.jsx';
import Gallery from './pages/Gallery.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const { loading } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar dark={dark} setDark={setDark} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Private><Dashboard /></Private>} />
        <Route path="/logs" element={<Private><Logs /></Private>} />
        <Route path="/stats" element={<Private><Stats /></Private>} />
        <Route path="/friends" element={<Private><Friends /></Private>} />
        <Route path="/gallery" element={<Private><Gallery /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
