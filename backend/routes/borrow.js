const router = require('express').Router();
const { borrowBook, returnBook, myBorrows, activeLoans } = require('../controllers/borrowController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/',           authenticate, borrowBook);
router.put('/return/:id',  authenticate, returnBook);
router.get('/my',          authenticate, myBorrows);
router.get('/active',      authenticate, authorize('admin'), activeLoans);

// Admin: all transactions including returned
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  const { query } = require('../models/db');
  const { rows } = await query(
    `SELECT t.*, b.title, b.author, u.name AS user_name, u.student_id
     FROM transactions t
     JOIN books b ON b.id = t.book_id
     JOIN users u ON u.id = t.user_id
     ORDER BY t.issued_at DESC LIMIT 200`
  );
  res.json(rows);
});

module.exports = router;
