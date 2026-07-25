import React, { useEffect, useState } from 'react';
import api from '../api.js';

function secToHours(sec) { return (sec / 3600).toFixed(1); }

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [email, setEmail] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [range, setRange] = useState('week');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const res = await api.get('/friends');
    setFriends(res.data.friends);
    setIncoming(res.data.incoming);
    setOutgoing(res.data.outgoing);
    const lb = await api.get(`/friends/leaderboard?range=${range}`);
    setLeaderboard(lb.data.leaderboard);
  };

  useEffect(() => { load(); }, [range]);

  const sendRequest = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/friends/request', { email });
      setMsg('Request sent!');
      setEmail('');
      load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to send request');
    }
  };

  const accept = async (id) => { await api.post(`/friends/${id}/accept`); load(); };
  const remove = async (id) => { await api.delete(`/friends/${id}`); load(); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Friends</h1>

      <form onSubmit={sendRequest} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Friend's email" className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm" />
        <button className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium">Add friend</button>
      </form>
      {msg && <p className="text-sm text-slate-500 dark:text-slate-400">{msg}</p>}

      {incoming.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-3">Pending requests</h3>
          {incoming.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{f.name} ({f.email})</span>
              <button onClick={() => accept(f.id)} className="text-sm font-medium text-emerald-600 hover:underline">Accept</button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Leaderboard</h3>
          <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-2 py-1 text-sm">
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="space-y-2">
          {leaderboard.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 w-5">{i + 1}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
              </div>
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{secToHours(p.study_seconds)}h</span>
            </div>
          ))}
        </div>
      </div>

      {friends.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-3">Your friends</h3>
          {friends.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{f.name} ({f.email})</span>
              <button onClick={() => remove(f.id)} className="text-sm text-slate-400 hover:text-red-500">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
