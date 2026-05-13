const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../models/db');

const LOAN_DAYS = 14;
const FINE_PER_DAY = 2.00; // ₹5 per day

// POST /api/borrow — issue a book
const borrowBook = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { book_id } = req.body;
    if (!book_id) return res.status(400).json({ error: 'book_id is required' });

    // Check availability
    const { rows: books } = await client.query(
      'SELECT * FROM books WHERE id = $1 FOR UPDATE', [book_id]
    );
    if (!books[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Book not found' }); }
    if (books[0].available_copies < 1) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'No copies available. Consider reserving this book.' }); }

    // Check duplicate active loan
    const { rows: active } = await client.query(
      `SELECT id FROM transactions WHERE user_id=$1 AND book_id=$2 AND returned_at IS NULL`, [req.user.id, book_id]
    );
    if (active.length > 0) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'You already have this book checked out' }); }

    const due_date = new Date(Date.now() + LOAN_DAYS * 24 * 60 * 60 * 1000);
    const id = uuidv4();

    const { rows: txn } = await client.query(
      `INSERT INTO transactions (id, user_id, book_id, due_date)
       VALUES ($1,$2,$3,$4) RETURNING *`, [id, req.user.id, book_id, due_date]
    );
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]
    );
    // Create notification
    await client.query(
      `INSERT INTO notifications (id, user_id, type, title, message)
       VALUES ($1,$2,'DUE_DATE','Book Borrowed',$3)`,
      [uuidv4(), req.user.id, `"${books[0].title}" is due on ${due_date.toLocaleDateString()}`]
    );
    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      transaction: txn[0],
      due_date,
      fine_per_day: FINE_PER_DAY,
      book: books[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// PUT /api/borrow/return/:id — return a book
const returnBook = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows: txns } = await client.query(
      'SELECT t.*, b.title FROM transactions t JOIN books b ON b.id = t.book_id WHERE t.id = $1 FOR UPDATE',
      [req.params.id]
    );
    const txn = txns[0];
    if (!txn) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Transaction not found' }); }
    if (txn.returned_at) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Book already returned' }); }

    const now = new Date();
    const overdueDays = Math.max(0, Math.floor((now - new Date(txn.due_date)) / 86400000));
    const fine_amount = overdueDays * FINE_PER_DAY;

    const { rows: updated } = await client.query(
      `UPDATE transactions SET returned_at = NOW(), fine_amount = $1
       WHERE id = $2 RETURNING *`,
      [fine_amount, txn.id]
    );
    await client.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [txn.book_id]);

    // Notify next person in reservation queue
    const { rows: nextRes } = await client.query(
      `SELECT res.*, u.email, u.name FROM reservations res
       JOIN users u ON u.id = res.user_id
       WHERE res.book_id = $1 AND res.status = 'PENDING'
       ORDER BY res.reserved_at ASC LIMIT 1`,
      [txn.book_id]
    );
    if (nextRes[0]) {
      await client.query(`UPDATE reservations SET status='NOTIFIED', notified_at=NOW() WHERE id=$1`, [nextRes[0].id]);
      await client.query(
        `INSERT INTO notifications (id, user_id, type, title, message) VALUES ($1,$2,'RESERVATION_AVAILABLE','Book Available',$3)`,
        [uuidv4(), nextRes[0].user_id, `"${txn.title}" is now available for pickup!`]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true, transaction: updated[0], fine_amount, overdue_days: overdueDays });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// GET /api/borrow/my — user's borrow history
const myBorrows = async (req, res) => {
  const { rows } = await query(
    `SELECT t.*, b.title, b.author, b.cover_url, b.shelf_location
     FROM transactions t JOIN books b ON b.id = t.book_id
     WHERE t.user_id = $1 ORDER BY t.issued_at DESC`,
    [req.user.id]
  );
  res.json(rows);
};

// GET /api/borrow/active — admin: all active loans
const activeLoans = async (req, res) => {
  const { rows } = await query(
    `SELECT t.*, b.title, b.author, u.name AS user_name, u.student_id
     FROM transactions t
     JOIN books b ON b.id = t.book_id
     JOIN users u ON u.id = t.user_id
     WHERE t.returned_at IS NULL ORDER BY t.due_date ASC`
  );
  res.json(rows);
};

module.exports = { borrowBook, returnBook, myBorrows, activeLoans };
