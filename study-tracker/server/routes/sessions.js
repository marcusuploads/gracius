const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const VALID_TYPES = ['study', 'rest', 'distraction', 'sleepy'];
const VALID_METHODS = ['timer', 'pomodoro', 'manual', 'offline'];

function validateSession(s) {
  if (!s || !s.start_time || !s.end_time || !s.duration_seconds) return false;
  if (!VALID_TYPES.includes(s.type)) return false;
  if (!VALID_METHODS.includes(s.method)) return false;
  return true;
}

// Create a single session (used by the live in-browser timer / manual entry)
router.post('/', async (req, res) => {
  const s = req.body;
  if (!validateSession(s)) return res.status(400).json({ error: 'Invalid session payload' });
  const result = await pool.query(
    `INSERT INTO sessions (user_id, subject_id, type, method, label, start_time, end_time, duration_seconds, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.id, s.subject_id || null, s.type, s.method, s.label || null, s.start_time, s.end_time, s.duration_seconds, s.note || null]
  );
  res.json({ session: result.rows[0] });
});

// Bulk sync: used when the app comes back online after a period of offline studying.
// Accepts an array of sessions queued locally; inserts all of them in one go.
router.post('/sync', async (req, res) => {
  const { sessions } = req.body;
  if (!Array.isArray(sessions) || !sessions.length) return res.status(400).json({ error: 'No sessions provided' });
  const valid = sessions.filter(validateSession);
  if (!valid.length) return res.status(400).json({ error: 'No valid sessions in batch' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const s of valid) {
      const result = await client.query(
        `INSERT INTO sessions (user_id, subject_id, type, method, label, start_time, end_time, duration_seconds, note)
         VALUES ($1,$2,$3,'offline',$4,$5,$6,$7,$8) RETURNING *`,
        [req.user.id, s.subject_id || null, s.type, s.label || null, s.start_time, s.end_time, s.duration_seconds, s.note || null]
      );
      inserted.push(result.rows[0]);
    }
    await client.query('COMMIT');
    res.json({ synced: inserted.length, sessions: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  } finally {
    client.release();
  }
});

// List sessions with optional filters
router.get('/', async (req, res) => {
  const { from, to, subject_id, type } = req.query;
  const clauses = ['user_id = $1'];
  const params = [req.user.id];
  if (from) { params.push(from); clauses.push(`start_time >= $${params.length}`); }
  if (to) { params.push(to); clauses.push(`start_time <= $${params.length}`); }
  if (subject_id) { params.push(subject_id); clauses.push(`subject_id = $${params.length}`); }
  if (type) { params.push(type); clauses.push(`type = $${params.length}`); }
  const result = await pool.query(
    `SELECT s.*, sub.name AS subject_name, sub.color AS subject_color
     FROM sessions s LEFT JOIN subjects sub ON sub.id = s.subject_id
     WHERE ${clauses.map((c) => c.replace(/^user_id/, 's.user_id').replace(/^start_time/, 's.start_time').replace(/^subject_id/, 's.subject_id').replace(/^type/, 's.type')).join(' AND ')}
     ORDER BY s.start_time DESC LIMIT 500`,
    params
  );
  res.json({ sessions: result.rows });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// Aggregated stats for day / week / month / year, plus today's unlock tier
router.get('/stats/summary', async (req, res) => {
  const range = req.query.range || 'week';
  const intervalMap = { day: '1 day', week: '7 days', month: '30 days', year: '365 days' };
  const interval = intervalMap[range] || intervalMap.week;

  const totalsBySubject = await pool.query(
    `SELECT s.subject_id, sub.name AS subject_name, sub.color, s.type,
            COALESCE(SUM(s.duration_seconds),0)::int AS total_seconds
     FROM sessions s
     LEFT JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.user_id = $1 AND s.start_time >= NOW() - $2::interval
     GROUP BY s.subject_id, sub.name, sub.color, s.type
     ORDER BY total_seconds DESC`,
    [req.user.id, interval]
  );

  const dailySeries = await pool.query(
    `SELECT date_trunc('day', start_time) AS day,
            COALESCE(SUM(duration_seconds) FILTER (WHERE type = 'study'),0)::int AS study_seconds
     FROM sessions
     WHERE user_id = $1 AND start_time >= NOW() - $2::interval
     GROUP BY day ORDER BY day ASC`,
    [req.user.id, interval]
  );

  const todayResult = await pool.query(
    `SELECT COALESCE(SUM(duration_seconds),0)::int AS today_study_seconds
     FROM sessions
     WHERE user_id = $1 AND type = 'study' AND start_time >= date_trunc('day', NOW())`,
    [req.user.id]
  );
  const todaySeconds = todayResult.rows[0].today_study_seconds;
  const todayHours = todaySeconds / 3600;
  let tier = 'none';
  if (todayHours >= 12) tier = 'godtier';
  else if (todayHours >= 8) tier = 'max';
  else if (todayHours >= 5) tier = 'advanced';
  else if (todayHours >= 3) tier = 'basic';

  res.json({
    range,
    totalsBySubject: totalsBySubject.rows,
    dailySeries: dailySeries.rows,
    todayStudySeconds: todaySeconds,
    unlockTier: tier
  });
});

module.exports = router;
