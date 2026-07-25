import React, { useEffect, useRef, useState } from 'react';
import { saveSessionOrQueue } from '../offlineQueue.js';

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function Timer({ subjects, onSessionSaved, unlockTier }) {
  const [mode, setMode] = useState('stopwatch'); // stopwatch | pomodoro
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState('work'); // work | break (pomodoro only)
  const [showManual, setShowManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');

  const startRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!subjectId && subjects.length) setSubjectId(subjects[0].id);
  }, [subjects]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Auto-flip pomodoro phase at target duration
  useEffect(() => {
    if (mode !== 'pomodoro' || !running) return;
    const target = phase === 'work' ? POMODORO_WORK : POMODORO_BREAK;
    if (elapsed >= target) {
      handleStop(true);
      setPhase((p) => (p === 'work' ? 'break' : 'work'));
      setFlash(phase === 'work' ? "Work session done — take a break! ☕" : 'Break over — back to it! 🔥');
      setTimeout(() => setFlash(''), 4000);
      setTimeout(() => handleStart(), 300);
    }
  }, [elapsed, mode, running, phase]);

  const handleStart = () => {
    if (!subjectId && mode === 'stopwatch') {
      alert('Pick a subject first');
      return;
    }
    startRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
  };

  const handleStop = async (isAutoPhaseFlip = false) => {
    setRunning(false);
    clearInterval(intervalRef.current);
    const durationSeconds = elapsed;
    if (durationSeconds < 1) return;

    const isBreak = mode === 'pomodoro' && phase === 'break';
    const session = {
      subject_id: isBreak ? null : (subjectId || null),
      type: isBreak ? 'rest' : 'study',
      method: mode === 'pomodoro' ? 'pomodoro' : 'timer',
      label: isBreak ? 'Pomodoro break' : null,
      start_time: new Date(startRef.current).toISOString(),
      end_time: new Date().toISOString(),
      duration_seconds: durationSeconds
    };

    setSaving(true);
    const result = await saveSessionOrQueue(session);
    setSaving(false);
    setElapsed(0);
    if (!isAutoPhaseFlip) {
      setFlash(result.queued ? "Saved offline — will sync when you're back online 📴" : 'Session saved ✅');
      setTimeout(() => setFlash(''), 3000);
    }
    onSessionSaved && onSessionSaved();
  };

  const tierFlames = { none: 0, basic: 1, advanced: 2, max: 3, godtier: 5 };
  const flameCount = running ? (tierFlames[unlockTier] || 0) : 0;

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
      {flameCount > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-2 pb-2 opacity-70">
          {Array.from({ length: flameCount }).map((_, i) => (
            <span
              key={i}
              className="text-3xl animate-flicker"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              🔥
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            disabled={running}
            onClick={() => setMode('stopwatch')}
            className={`px-3 py-1.5 text-sm rounded-md font-medium ${mode === 'stopwatch' ? 'bg-white dark:bg-slate-700 shadow text-brand-700 dark:text-white' : 'text-slate-500'}`}
          >
            Stopwatch
          </button>
          <button
            disabled={running}
            onClick={() => setMode('pomodoro')}
            className={`px-3 py-1.5 text-sm rounded-md font-medium ${mode === 'pomodoro' ? 'bg-white dark:bg-slate-700 shadow text-brand-700 dark:text-white' : 'text-slate-500'}`}
          >
            Pomodoro
          </button>
        </div>
        <button
          onClick={() => setShowManual(true)}
          className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          + Manual entry
        </button>
      </div>

      {mode === 'pomodoro' && (
        <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
          {phase === 'work' ? '🧠 Focus session (25 min)' : '☕ Break (5 min)'}
        </p>
      )}

      <div className="text-center relative">
        <div className="text-6xl md:text-7xl font-mono font-bold tracking-tight text-slate-800 dark:text-white tabular-nums">
          {formatTime(elapsed)}
        </div>
      </div>

      <div className="mt-5">
        <select
          value={subjectId}
          disabled={running}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-2 text-sm disabled:opacity-60"
        >
          {subjects.length === 0 && <option value="">Add a subject first</option>}
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex gap-3">
        {!running ? (
          <button
            onClick={handleStart}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition"
          >
            ▶ Start
          </button>
        ) : (
          <button
            onClick={() => handleStop(false)}
            disabled={saving}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            ⏹ Stop &amp; Save
          </button>
        )}
      </div>

      {flash && (
        <p className="mt-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">{flash}</p>
      )}

      {showManual && (
        <ManualEntryModal
          subjects={subjects}
          onClose={() => setShowManual(false)}
          onSaved={() => { setShowManual(false); onSessionSaved && onSessionSaved(); }}
        />
      )}
    </div>
  );
}

function ManualEntryModal({ subjects, onClose, onSaved }) {
  const [type, setType] = useState('study');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const durationSeconds = hours * 3600 + minutes * 60;
    if (durationSeconds < 60) { alert('Enter at least 1 minute'); return; }
    const now = Date.now();
    const session = {
      subject_id: type === 'study' ? (subjectId || null) : null,
      type,
      method: 'manual',
      label: label || (type === 'distraction' ? 'Distraction' : null),
      start_time: new Date(now - durationSeconds * 1000).toISOString(),
      end_time: new Date(now).toISOString(),
      duration_seconds: durationSeconds,
      note: note || null
    };
    setSaving(true);
    await saveSessionOrQueue(session);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add a manual log</h3>

        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm">
            <option value="study">Study</option>
            <option value="rest">Rest</option>
            <option value="distraction">Distraction (YouTube, social, etc.)</option>
            <option value="sleepy">Sleepy / low energy</option>
          </select>
        </div>

        {type === 'study' && (
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {type === 'distraction' && (
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">What distracted you?</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="YouTube, Instagram, phone..." className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm" />
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Hours</label>
            <input type="number" min="0" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Minutes</label>
            <input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-60">
            {saving ? 'Saving...' : 'Save log'}
          </button>
        </div>
      </form>
    </div>
  );
}
