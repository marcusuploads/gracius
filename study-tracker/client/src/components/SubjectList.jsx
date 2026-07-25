import React, { useState } from 'react';
import api from '../api.js';

const PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444'];

export default function SubjectList({ subjects, refresh }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [adding, setAdding] = useState(false);

  const addSubject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await api.post('/subjects', { name: name.trim(), color });
      setName('');
      setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      refresh();
    } finally {
      setAdding(false);
    }
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject? Its past logs will stay, just unlinked.')) return;
    await api.delete(`/subjects/${id}`);
    refresh();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="font-bold text-slate-800 dark:text-white mb-3">Subjects</h3>
      <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
        {subjects.length === 0 && (
          <p className="text-sm text-slate-400">No subjects yet — add your first one below.</p>
        )}
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.name}</span>
            </div>
            <button onClick={() => deleteSubject(s.id)} className="text-slate-400 hover:text-red-500 text-sm">✕</button>
          </div>
        ))}
      </div>
      <form onSubmit={addSubject} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New subject..."
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm"
        />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer" />
        <button disabled={adding} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-60">
          Add
        </button>
      </form>
    </div>
  );
}
