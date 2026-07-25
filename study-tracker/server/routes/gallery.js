const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireOwner } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireOwner);

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT id, image_data, caption, created_at FROM gallery WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ photos: result.rows });
});

router.post('/', async (req, res) => {
  const { image_data, caption } = req.body;
  if (!image_data) return res.status(400).json({ error: 'image_data (base64) is required' });
  const result = await pool.query(
    'INSERT INTO gallery (user_id, image_data, caption) VALUES ($1,$2,$3) RETURNING id, caption, created_at',
    [req.user.id, image_data, caption || null]
  );
  res.json({ photo: result.rows[0] });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM gallery WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
