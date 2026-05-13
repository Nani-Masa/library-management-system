const { v4: uuidv4 } = require('uuid');
const { query } = require('../models/db');

const getProgress = async (req, res) => {
  const { rows } = await query(
    `SELECT rp.*, b.title, b.author, b.cover_url,
            (rp.pages_read::float/NULLIF(rp.total_pages,0)*100)::int AS percent
     FROM reading_progress rp JOIN books b ON b.id = rp.book_id
     WHERE rp.user_id=$1 ORDER BY rp.updated_at DESC`, [req.user.id]
  );
  res.json(rows);
};

const upsertProgress = async (req, res) => {
  try {
    const { book_id, pages_read, total_pages, status } = req.body;
    const { rows } = await query(
      `INSERT INTO reading_progress (id,user_id,book_id,pages_read,total_pages,status)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id,book_id) DO UPDATE
       SET pages_read=$4, total_pages=$5, status=$6, updated_at=NOW(),
           completed_at = CASE WHEN $6='completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END
       RETURNING *`,
      [uuidv4(), req.user.id, book_id, pages_read, total_pages, status || 'reading']
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getProgress, upsertProgress };
