const { v4: uuidv4 } = require('uuid');
const { query } = require('../models/db');

const reserve = async (req, res) => {
  try {
    const { book_id } = req.body;
    const existing = await query(
      `SELECT id FROM reservations WHERE user_id=$1 AND book_id=$2 AND status='PENDING'`,
      [req.user.id, book_id]
    );
    if (existing.rows.length) return res.status(409).json({ error: 'Already reserved' });
    const { rows } = await query(
      `INSERT INTO reservations (id,user_id,book_id) VALUES ($1,$2,$3) RETURNING *`,
      [uuidv4(), req.user.id, book_id]
    );
    res.status(201).json({ success: true, reservation: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const myReservations = async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, b.title, b.author FROM reservations r JOIN books b ON b.id = r.book_id
     WHERE r.user_id=$1 ORDER BY r.reserved_at DESC`, [req.user.id]
  );
  res.json(rows);
};

const cancel = async (req, res) => {
  const { rowCount } = await query(
    `UPDATE reservations SET status='CANCELLED' WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Reservation not found' });
  res.json({ success: true });
};

module.exports = { reserve, myReservations, cancel };
