const { query } = require('../models/db');

const listUsers = async (req, res) => {
  const { rows } = await query(
    `SELECT id,name,email,role,student_id,created_at FROM users ORDER BY created_at DESC`
  );
  res.json(rows);
};

const getUser = async (req, res) => {
  const { rows } = await query(
    `SELECT id,name,email,role,student_id,created_at FROM users WHERE id=$1`, [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
};

module.exports = { listUsers, getUser };
