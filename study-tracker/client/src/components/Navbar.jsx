import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ dark, setDark }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-brand-600 text-white'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-bold text-lg text-slate-800 dark:text-white">StudyForge</span>
        </div>
        {user && (
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={linkClass} end>Dashboard</NavLink>
            <NavLink to="/logs" className={linkClass}>Logs</NavLink>
            <NavLink to="/stats" className={linkClass}>Stats</NavLink>
            <NavLink to="/friends" className={linkClass}>Friends</NavLink>
            {user.isOwner && <NavLink to="/gallery" className={linkClass}>Gallery</NavLink>}
          </div>
        )}
        <div className="flex items-center gap-3">
          <span
            title={online ? 'Online' : 'Offline — sessions will sync automatically'}
            className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
          />
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {dark ? '☀️' : '🌙'}
          </button>
          {user && (
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-500"
            >
              Log out
            </button>
          )}
        </div>
      </div>
      {user && (
        <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          <NavLink to="/" className={linkClass} end>Dashboard</NavLink>
          <NavLink to="/logs" className={linkClass}>Logs</NavLink>
          <NavLink to="/stats" className={linkClass}>Stats</NavLink>
          <NavLink to="/friends" className={linkClass}>Friends</NavLink>
          {user.isOwner && <NavLink to="/gallery" className={linkClass}>Gallery</NavLink>}
        </div>
      )}
    </nav>
  );
}
