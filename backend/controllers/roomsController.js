const { v4: uuidv4 } = require('uuid');
const { query } = require('../models/db');

const getAvailability = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
  const { rows } = await query(
    `SELECT sr.*, u.name AS user_name FROM study_rooms sr
     JOIN users u ON u.id = sr.user_id WHERE sr.date = $1`, [date]
  );
  const rooms = ['Room 1','Room 2','Room 3','Room 4','Room 5'];
  const result = rooms.map(room => ({
    room, bookings: rows.filter(b => b.room_number === room)
  }));
  res.json(result);
};

const bookRoom = async (req, res) => {
  try {
    const { room_number, date, start_time, end_time } = req.body;
    const conflict = await query(
      `SELECT id FROM study_rooms WHERE room_number=$1 AND date=$2
       AND start_time < $4 AND end_time > $3`,
      [room_number, date, start_time, end_time]
    );
    if (conflict.rows.length) return res.status(409).json({ error: 'Time slot already booked' });
    const { rows } = await query(
      `INSERT INTO study_rooms (id,user_id,room_number,date,start_time,end_time)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [uuidv4(), req.user.id, room_number, date, start_time, end_time]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const myBookings = async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM study_rooms WHERE user_id=$1 ORDER BY date DESC, start_time DESC LIMIT 20`,
    [req.user.id]
  );
  res.json(rows);
};

module.exports = { getAvailability, bookRoom, myBookings };
