const { v4: uuidv4 } = require('uuid');
const { query } = require('../models/db');

// GET /api/fines — all fines (admin only)
const getAllFines = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.user_id, t.book_id, t.issued_at, t.due_date,
              t.returned_at, t.fine_amount, t.fine_imposed, t.fine_imposed_by,
              t.fine_imposed_at, t.fine_paid, t.fine_note,
              u.name AS user_name, u.email AS user_email, u.student_id,
              b.title AS book_title, b.author AS book_author,
              imp.name AS imposed_by_name
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       JOIN books b ON b.id = t.book_id
       LEFT JOIN users imp ON imp.id = t.fine_imposed_by
       WHERE t.fine_amount > 0 OR t.fine_imposed = true
       ORDER BY t.fine_imposed_at DESC NULLS LAST, t.due_date ASC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/fines/overdue — all overdue books (not yet returned)
const getOverdue = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.user_id, t.book_id, t.issued_at, t.due_date,
              t.fine_amount, t.fine_imposed, t.fine_paid,
              u.name AS user_name, u.email AS user_email, u.student_id,
              b.title AS book_title, b.author AS book_author,
              EXTRACT(DAY FROM NOW() - t.due_date)::int AS overdue_days,
              GREATEST(0, EXTRACT(DAY FROM NOW() - t.due_date)::int * 2.00) AS calculated_fine
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       JOIN books b ON b.id = t.book_id
       WHERE t.returned_at IS NULL
         AND t.due_date < NOW()
       ORDER BY t.due_date ASC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /api/fines/my — current user's fines
const getMyFines = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.issued_at, t.due_date, t.returned_at,
              t.fine_amount, t.fine_imposed, t.fine_imposed_at,
              t.fine_paid, t.fine_note,
              b.title AS book_title, b.author AS book_author,
              imp.name AS imposed_by_name
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       LEFT JOIN users imp ON imp.id = t.fine_imposed_by
       WHERE t.user_id = $1
         AND (t.fine_amount > 0 OR t.fine_imposed = true)
       ORDER BY t.fine_imposed_at DESC NULLS LAST`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /api/fines/impose/:transaction_id — admin imposes a fine
const imposeFine = async (req, res) => {
  try {
    const { fine_amount, fine_note } = req.body;
    if (!fine_amount || fine_amount <= 0)
      return res.status(400).json({ error: 'Fine amount must be greater than 0' });

    const { rows: txns } = await query(
      `SELECT t.*, u.name AS user_name, u.email, b.title
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       JOIN books b ON b.id = t.book_id
       WHERE t.id = $1`,
      [req.params.transaction_id]
    );
    if (!txns[0]) return res.status(404).json({ error: 'Transaction not found' });

    const txn = txns[0];

    const { rows } = await query(
      `UPDATE transactions
       SET fine_amount = $1,
           fine_imposed = true,
           fine_imposed_by = $2,
           fine_imposed_at = NOW(),
           fine_note = $3
       WHERE id = $4
       RETURNING *`,
      [fine_amount, req.user.id, fine_note || null, req.params.transaction_id]
    );

    // Create notification for the student
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message)
       VALUES ($1, $2, 'FINE_APPLIED', 'Fine Imposed', $3)`,
      [
        uuidv4(), txn.user_id,
        `A fine of $${parseFloat(fine_amount).toFixed(2)} has been imposed on "${txn.title}". ${fine_note ? 'Reason: ' + fine_note : 'Please contact the library for details.'}`,
      ]
    );

    res.json({ success: true, transaction: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PUT /api/fines/pay/:transaction_id — mark fine as paid (admin only)
const markFinePaid = async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE transactions SET fine_paid = true WHERE id = $1 RETURNING *`,
      [req.params.transaction_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Transaction not found' });

    // Notify student
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message)
       VALUES ($1, $2, 'GENERAL', 'Fine Cleared', $3)`,
      [uuidv4(), rows[0].user_id, `Your fine of $${parseFloat(rows[0].fine_amount).toFixed(2)} has been marked as paid. Thank you!`]
    );

    res.json({ success: true, transaction: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PUT /api/fines/waive/:transaction_id — waive fine (admin only)
const waiveFine = async (req, res) => {
  try {
    const { rows: txns } = await query(
      'SELECT * FROM transactions WHERE id = $1', [req.params.transaction_id]
    );
    if (!txns[0]) return res.status(404).json({ error: 'Transaction not found' });

    const { rows } = await query(
      `UPDATE transactions
       SET fine_amount = 0, fine_imposed = false, fine_paid = false,
           fine_note = 'Fine waived by admin'
       WHERE id = $1 RETURNING *`,
      [req.params.transaction_id]
    );

    await query(
      `INSERT INTO notifications (id, user_id, type, title, message)
       VALUES ($1, $2, 'GENERAL', 'Fine Waived', 'Your fine has been waived by the administrator.')`,
      [uuidv4(), txns[0].user_id]
    );

    res.json({ success: true, transaction: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getAllFines, getOverdue, getMyFines, imposeFine, markFinePaid, waiveFine };
