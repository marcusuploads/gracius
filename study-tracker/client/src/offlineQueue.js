import api from './api';

const QUEUE_KEY = 'st_pending_sessions';

export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function queueSession(session) {
  const queue = getQueue();
  queue.push(session);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

// Attempts to sync any locally-queued offline sessions to the backend.
// Returns the number of sessions synced (0 if nothing to sync or offline).
export async function flushQueue() {
  const queue = getQueue();
  if (!queue.length || !navigator.onLine) return 0;
  try {
    const res = await api.post('/sessions/sync', { sessions: queue });
    clearQueue();
    return res.data.synced || 0;
  } catch (err) {
    // Stay queued if sync fails (e.g. server briefly unreachable)
    return 0;
  }
}

// Tries to save a session directly; if the request fails (offline / server down),
// it falls back to the local queue so nothing is lost.
export async function saveSessionOrQueue(session) {
  if (!navigator.onLine) {
    queueSession(session);
    return { queued: true };
  }
  try {
    await api.post('/sessions', session);
    return { queued: false };
  } catch (err) {
    queueSession(session);
    return { queued: true };
  }
}
