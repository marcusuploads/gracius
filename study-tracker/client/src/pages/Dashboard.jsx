import React, { useCallback, useEffect, useState } from 'react';
import api from '../api.js';
import Timer from '../components/Timer.jsx';
import SubjectList from '../components/SubjectList.jsx';
import UnlockBanner from '../components/UnlockBanner.jsx';
import { flushQueue, getQueue } from '../offlineQueue.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [syncMsg, setSyncMsg] = useState('');

  const loadSubjects = useCallback(async () => {
    const res = await api.get('/subjects');
    setSubjects(res.data.subjects);
  }, []);

  const loadStats = useCallback(async () => {
    const res = await api.get('/sessions/stats/summary?range=day');
    setStats(res.data);
  }, []);

  const trySync = useCallback(async () => {
    const pending = getQueue();
    if (pending.length) {
      const n = await flushQueue();
      if (n > 0) {
        setSyncMsg(`Synced ${n} offline session${n > 1 ? 's' : ''} 🎉`);
        loadStats();
        setTimeout(() => setSyncMsg(''), 4000);
      }
    }
  }, [loadStats]);

  useEffect(() => {
    loadSubjects();
    loadStats();
    trySync();
    window.addEventListener('online', trySync);
    return () => window.removeEventListener('online', trySync);
  }, []);

  const refreshAll = () => { loadSubjects(); loadStats(); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Hey {user?.name?.split(' ')[0] || 'there'} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Let's get some deep work done.</p>
      </div>

      {syncMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium rounded-lg px-4 py-2">
          {syncMsg}
        </div>
      )}

      {stats && <UnlockBanner todaySeconds={stats.todayStudySeconds} tier={stats.unlockTier} />}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Timer subjects={subjects} onSessionSaved={refreshAll} unlockTier={stats?.unlockTier || 'none'} />
        </div>
        <div>
          <SubjectList subjects={subjects} refresh={loadSubjects} />
        </div>
      </div>
    </div>
  );
}
