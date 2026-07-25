import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const RANGES = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' }
];

function secToHours(sec) { return +(sec / 3600).toFixed(2); }

export default function Stats() {
  const [range, setRange] = useState('week');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/sessions/stats/summary?range=${range}`).then((res) => setData(res.data));
  }, [range]);

  const bySubject = (data?.totalsBySubject || []).filter((r) => r.type === 'study' && r.subject_name);
  const dailySeries = (data?.dailySeries || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    hours: secToHours(d.study_seconds)
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Stats</h1>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium ${range === r.key ? 'bg-white dark:bg-slate-700 shadow text-brand-700 dark:text-white' : 'text-slate-500'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Study hours over time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailySeries}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Time by subject</h3>
          {bySubject.length === 0 ? (
            <p className="text-slate-400 text-sm">No study sessions in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={bySubject} dataKey="total_seconds" nameKey="subject_name" cx="50%" cy="50%" outerRadius={90} label={(d) => d.subject_name}>
                  {bySubject.map((s, i) => <Cell key={i} fill={s.color || '#6366f1'} />)}
                </Pie>
                <Tooltip formatter={(v) => `${secToHours(v)}h`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
