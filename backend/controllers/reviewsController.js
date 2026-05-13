const { v4: uuidv4 } = require('uuid');
const { query } = require('../models/db');

const createReview = async (req, res) => {
  try {
    const { book_id, rating, content } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    const { rows } = await query(
      `INSERT INTO reviews (id,user_id,book_id,rating,content) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id,book_id) DO UPDATE SET rating=$4,content=$5,updated_at=NOW() RETURNING *`,
      [uuidv4(), req.user.id, book_id, rating, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getBookReviews = async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.book_id=$1 ORDER BY r.created_at DESC`, [req.params.bookId]
  );
  res.json(rows);
};

module.exports = { createReview, getBookReviews };
