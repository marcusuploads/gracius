import React, { useEffect, useState } from 'react';
import api from '../api.js';

const TYPE_STYLE = {
  study: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  rest: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  distraction: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  sleepy: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
};

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function Logs() {
  const [sessions, setSessions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = typeFilter ? `?type=${typeFilter}` : '';
    const res = await api.get(`/sessions${params}`);
    setSessions(res.data.sessions);
    setLoading(false);
  };

  useEffect(() => { load(); }, [typeFilter]);

  const remove = async (id) => {
    if (!confirm('Delete this log entry?')) return;
    await api.delete(`/sessions/${id}`);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Study Logs</h1>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm">
          <option value="">All types</option>
          <option value="study">Study</option>
          <option value="rest">Rest</option>
          <option value="distraction">Distraction</option>
          <option value="sleepy">Sleepy</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-slate-400">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No logs yet — start a timer or add one manually.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Subject / Label</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${TYPE_STYLE[s.type]}`}>{s.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.label || s.subject_name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{formatDuration(s.duration_seconds)}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{s.method}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(s.start_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s.id)} className="text-slate-400 hover:text-red-500">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
