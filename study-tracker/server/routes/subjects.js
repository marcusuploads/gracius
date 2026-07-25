const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, color, created_at FROM subjects WHERE user_id = $1 ORDER BY created_at ASC',
    [req.user.id]
  );
  res.json({ subjects: result.rows });
});

router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Subject name is required' });
  const result = await pool.query(
    'INSERT INTO subjects (user_id, name, color) VALUES ($1, $2, $3) RETURNING id, name, color, created_at',
    [req.user.id, name.trim(), color || '#6366f1']
  );
  res.json({ subject: result.rows[0] });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM subjects WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
