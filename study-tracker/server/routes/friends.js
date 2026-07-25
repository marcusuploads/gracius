const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.post('/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const target = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!target.rows.length) return res.status(404).json({ error: 'No user with that email' });
  const friend = target.rows[0];
  if (friend.id === req.user.id) return res.status(400).json({ error: "You can't add yourself" });
  try {
    await pool.query(
      'INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1,$2,$3)',
      [req.user.id, friend.id, 'pending']
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: 'Friend request already exists' });
  }
});

router.post('/:id/accept', async (req, res) => {
  const result = await pool.query(
    `UPDATE friendships SET status = 'accepted'
     WHERE requester_id = $1 AND addressee_id = $2 AND status = 'pending' RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'No pending request found' });
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query(
    `DELETE FROM friendships WHERE
     (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
    [req.user.id, req.params.id]
  );
  res.json({ ok: true });
});

router.get('/', async (req, res) => {
  const accepted = await pool.query(
    `SELECT u.id, u.name, u.email FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
     WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted'`,
    [req.user.id]
  );
  const pendingIncoming = await pool.query(
    `SELECT u.id, u.name, u.email FROM friendships f
     JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = $1 AND f.status = 'pending'`,
    [req.user.id]
  );
  const pendingOutgoing = await pool.query(
    `SELECT u.id, u.name, u.email FROM friendships f
     JOIN users u ON u.id = f.addressee_id
     WHERE f.requester_id = $1 AND f.status = 'pending'`,
    [req.user.id]
  );
  res.json({ friends: accepted.rows, incoming: pendingIncoming.rows, outgoing: pendingOutgoing.rows });
});

router.get('/leaderboard', async (req, res) => {
  const range = req.query.range || 'week';
  const intervalMap = { day: '1 day', week: '7 days', month: '30 days', year: '365 days' };
  const interval = intervalMap[range] || intervalMap.week;

  const result = await pool.query(
    `WITH my_friends AS (
       SELECT CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END AS friend_id
       FROM friendships f
       WHERE (f.requester_id = $1 OR f.addressee_id = $1) AND f.status = 'accepted'
     ),
     people AS (
       SELECT $1::int AS uid UNION SELECT friend_id FROM my_friends
     )
     SELECT u.id, u.name,
            COALESCE(SUM(s.duration_seconds) FILTER (WHERE s.type = 'study' AND s.start_time >= NOW() - $2::interval),0)::int AS study_seconds
     FROM people p
     JOIN users u ON u.id = p.uid
     LEFT JOIN sessions s ON s.user_id = u.id
     GROUP BY u.id, u.name
     ORDER BY study_seconds DESC`,
    [req.user.id, interval]
  );
  res.json({ leaderboard: result.rows });
});

module.exports = router;
