const { query } = require('../models/db');

const getNotifications = async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,
    [req.user.id]
  );
  res.json(rows);
};

const markRead = async (req, res) => {
  await query(`UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
  res.json({ success: true });
};

const markAllRead = async (req, res) => {
  await query(`UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL`, [req.user.id]);
  res.json({ success: true });
};

module.exports = { getNotifications, markRead, markAllRead };
