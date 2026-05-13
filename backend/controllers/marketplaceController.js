const { v4: uuidv4 } = require('uuid');
const { query } = require('../models/db');

const list = async (req, res) => {
  const { rows } = await query(
    `SELECT d.*, u.name AS donor_name FROM donations d
     JOIN users u ON u.id = d.donor_id WHERE d.status='AVAILABLE' ORDER BY d.created_at DESC`
  );
  res.json(rows);
};

const create = async (req, res) => {
  try {
    const { title, author, isbn, condition, description } = req.body;
    const { rows } = await query(
      `INSERT INTO donations (id,donor_id,title,author,isbn,condition,description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [uuidv4(), req.user.id, title, author, isbn, condition || 'GOOD', description]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const claim = async (req, res) => {
  const { rowCount } = await query(
    `UPDATE donations SET status='CLAIMED', claimed_by=$1 WHERE id=$2 AND status='AVAILABLE'`,
    [req.user.id, req.params.id]
  );
  if (!rowCount) return res.status(409).json({ error: 'Not available or already claimed' });
  res.json({ success: true });
};

module.exports = { list, create, claim };
