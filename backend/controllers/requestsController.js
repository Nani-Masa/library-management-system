const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../models/db');

// ── Student: Create a borrow or return request ──────────────
const createRequest = async (req, res) => {
  try {
    const { book_id, type = 'BORROW', note } = req.body;
    if (!book_id) return res.status(400).json({ error: 'book_id is required' });
    if (!['BORROW','RETURN'].includes(type))
      return res.status(400).json({ error: 'type must be BORROW or RETURN' });

    // Check book exists
    const { rows: books } = await query('SELECT * FROM books WHERE id = $1', [book_id]);
    if (!books[0]) return res.status(404).json({ error: 'Book not found' });
    const book = books[0];

    if (type === 'BORROW') {
      // Check availability
      if (book.available_copies < 1)
        return res.status(409).json({ error: 'No copies available. You can reserve this book instead.' });

      // Check no duplicate pending request
      const { rows: existing } = await query(
        `SELECT id FROM borrow_requests
         WHERE user_id=$1 AND book_id=$2 AND type='BORROW' AND status='PENDING'`,
        [req.user.id, book_id]
      );
      if (existing.length > 0)
        return res.status(409).json({ error: 'You already have a pending borrow request for this book' });

      // Check not already borrowed
      const { rows: active } = await query(
        `SELECT id FROM transactions WHERE user_id=$1 AND book_id=$2 AND returned_at IS NULL`,
        [req.user.id, book_id]
      );
      if (active.length > 0)
        return res.status(409).json({ error: 'You already have this book borrowed' });
    }

    if (type === 'RETURN') {
      // Must have active loan
      const { rows: loans } = await query(
        `SELECT id FROM transactions WHERE user_id=$1 AND book_id=$2 AND returned_at IS NULL`,
        [req.user.id, book_id]
      );
      if (loans.length === 0)
        return res.status(409).json({ error: 'You do not have an active loan for this book' });

      // No duplicate pending return request
      const { rows: existing } = await query(
        `SELECT id FROM borrow_requests
         WHERE user_id=$1 AND book_id=$2 AND type='RETURN' AND status='PENDING'`,
        [req.user.id, book_id]
      );
      if (existing.length > 0)
        return res.status(409).json({ error: 'You already have a pending return request for this book' });
    }

    // Create the request
    const { rows } = await query(
      `INSERT INTO borrow_requests (id, user_id, book_id, type, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [uuidv4(), req.user.id, book_id, type, note || null]
    );

    // Notify all admins and librarians
    const { rows: staff } = await query(
      `SELECT id FROM users WHERE role IN ('admin','librarian')`
    );
    for (const s of staff) {
      await query(
        `INSERT INTO notifications (id, user_id, type, title, message)
         VALUES ($1,$2,'GENERAL',$3,$4)`,
        [
          uuidv4(), s.id,
          `New ${type} Request`,
          `${req.user.name || 'A student'} has requested to ${type === 'BORROW' ? 'borrow' : 'return'} "${book.title}". Please review and approve.`,
        ]
      );
    }

    res.status(201).json({
      success: true,
      request: rows[0],
      message: type === 'BORROW'
        ? 'Borrow request submitted! Please visit the library once approved.'
        : 'Return request submitted! Please bring the book to the library once approved.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Get requests (student: own, staff: all) ─────────────────
const getRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    const isStaff = ['admin','librarian'].includes(req.user.role);

    const conditions = [];
    const params = [];
    let i = 1;

    if (!isStaff) { conditions.push(`br.user_id = $${i++}`); params.push(req.user.id); }
    if (status)   { conditions.push(`br.status = $${i++}`); params.push(status); }
    if (type)     { conditions.push(`br.type = $${i++}`);   params.push(type); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await query(
      `SELECT br.*,
              u.name AS user_name, u.email AS user_email, u.student_id,
              b.title AS book_title, b.author AS book_author,
              b.shelf_location, b.available_copies,
              rev.name AS reviewed_by_name
       FROM borrow_requests br
       JOIN users u ON u.id = br.user_id
       JOIN books b ON b.id = br.book_id
       LEFT JOIN users rev ON rev.id = br.reviewed_by
       ${where}
       ORDER BY
         CASE br.status WHEN 'PENDING' THEN 0 ELSE 1 END,
         br.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Staff: Approve a request ────────────────────────────────
const approveRequest = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { admin_note } = req.body;

    const { rows: reqs } = await client.query(
      `SELECT br.*, b.title, b.available_copies, u.name AS user_name, u.email
       FROM borrow_requests br
       JOIN books b ON b.id = br.book_id
       JOIN users u ON u.id = br.user_id
       WHERE br.id = $1 FOR UPDATE`,
      [req.params.id]
    );
    const request = reqs[0];
    if (!request) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Request not found' }); }
    if (request.status !== 'PENDING') { await client.query('ROLLBACK'); return res.status(409).json({ error: `Request is already ${request.status}` }); }

    let transactionId = null;

    if (request.type === 'BORROW') {
      // Check still available
      if (request.available_copies < 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Book no longer available' });
      }
      // Create transaction
      const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const txnId = uuidv4();
      await client.query(
        `INSERT INTO transactions (id, user_id, book_id, due_date)
         VALUES ($1,$2,$3,$4)`,
        [txnId, request.user_id, request.book_id, due]
      );
      // Decrement available copies
      await client.query(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
        [request.book_id]
      );
      transactionId = txnId;

      // Notify student
      await client.query(
        `INSERT INTO notifications (id, user_id, type, title, message)
         VALUES ($1,$2,'GENERAL','Borrow Request Approved ✅',$3)`,
        [uuidv4(), request.user_id,
         `Your request to borrow "${request.title}" has been approved! Please visit the library to collect your book. It is due in 14 days.`]
      );
    }

    if (request.type === 'RETURN') {
      // Find active loan
      const { rows: loans } = await client.query(
        `SELECT * FROM transactions WHERE user_id=$1 AND book_id=$2 AND returned_at IS NULL`,
        [request.user_id, request.book_id]
      );
      if (!loans[0]) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'No active loan found' }); }

      const loan = loans[0];
      const now = new Date();
      const overdueDays = Math.max(0, Math.floor((now - new Date(loan.due_date)) / 86400000));
      const fine = overdueDays * 2.00; // ₹5 per day

      // Process return
      await client.query(
        `UPDATE transactions SET returned_at=NOW(), fine_amount=$1 WHERE id=$2`,
        [fine, loan.id]
      );
      await client.query(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
        [request.book_id]
      );
      transactionId = loan.id;

      // Notify student
      await client.query(
        `INSERT INTO notifications (id, user_id, type, title, message)
         VALUES ($1,$2,'BOOK_RETURNED','Return Approved ✅',$3)`,
        [uuidv4(), request.user_id,
         `Your return of "${request.title}" has been confirmed.${fine > 0 ? ` A fine of $${fine.toFixed(2)} has been applied for ${overdueDays} overdue days.` : ' Thank you for returning on time!'}`]
      );
    }

    // Update request status
    await client.query(
      `UPDATE borrow_requests
       SET status='APPROVED', reviewed_by=$1, reviewed_at=NOW(),
           admin_note=$2, transaction_id=$3, updated_at=NOW()
       WHERE id=$4`,
      [req.user.id, admin_note || null, transactionId, request.id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: `${request.type} request approved successfully` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
};

// ── Staff: Reject a request ─────────────────────────────────
const rejectRequest = async (req, res) => {
  try {
    const { admin_note } = req.body;
    const { rows: reqs } = await query(
      `SELECT br.*, b.title, u.name AS user_name
       FROM borrow_requests br
       JOIN books b ON b.id = br.book_id
       JOIN users u ON u.id = br.user_id
       WHERE br.id=$1`,
      [req.params.id]
    );
    const request = reqs[0];
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(409).json({ error: `Already ${request.status}` });

    await query(
      `UPDATE borrow_requests
       SET status='REJECTED', reviewed_by=$1, reviewed_at=NOW(),
           admin_note=$2, updated_at=NOW()
       WHERE id=$3`,
      [req.user.id, admin_note || 'Request rejected by staff', request.id]
    );

    // Notify student
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message)
       VALUES ($1,$2,'GENERAL','Request Rejected ❌',$3)`,
      [uuidv4(), request.user_id,
       `Your ${request.type.toLowerCase()} request for "${request.title}" was rejected. ${admin_note ? 'Reason: ' + admin_note : 'Please contact the library for more information.'}`]
    );

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Student: Cancel own pending request ─────────────────────
const cancelRequest = async (req, res) => {
  try {
    const { rowCount } = await query(
      `UPDATE borrow_requests
       SET status='CANCELLED', updated_at=NOW()
       WHERE id=$1 AND user_id=$2 AND status='PENDING'`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Request not found or already processed' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Stats for staff dashboard ────────────────────────────────
const getStats = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT status, type, COUNT(*) as count
       FROM borrow_requests
       GROUP BY status, type`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { createRequest, getRequests, approveRequest, rejectRequest, cancelRequest, getStats };
