const { query } = require('../models/db');

// GET /api/analytics/dashboard
const dashboard = async (req, res) => {
  try {
    const [
      booksRes, usersRes, issuedRes, overdueRes,
      categoriesRes, topBooksRes, recentRes
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM books'),
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM transactions WHERE returned_at IS NULL'),
      query('SELECT COUNT(*) FROM transactions WHERE returned_at IS NULL AND due_date < NOW()'),
      query(`SELECT category, COUNT(*) AS count FROM books GROUP BY category ORDER BY count DESC LIMIT 6`),
      query(`SELECT b.title, b.author, COUNT(t.id) AS borrow_count
             FROM books b JOIN transactions t ON t.book_id = b.id
             GROUP BY b.id ORDER BY borrow_count DESC LIMIT 5`),
      query(`SELECT t.issued_at, t.returned_at, b.title, u.name AS user_name
             FROM transactions t JOIN books b ON b.id = t.book_id JOIN users u ON u.id = t.user_id
             ORDER BY t.issued_at DESC LIMIT 10`),
    ]);

    // Monthly trend (last 8 months)
    const monthly = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const start = new Date(d);
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);
      const { rows } = await query(
        `SELECT COUNT(*) FROM transactions WHERE issued_at >= $1 AND issued_at < $2`,
        [start, end]
      );
      monthly.push({
        month: start.toLocaleString('default', { month: 'short' }),
        count: parseInt(rows[0].count),
      });
    }

    res.json({
      stats: {
        total_books: parseInt(booksRes.rows[0].count),
        total_users: parseInt(usersRes.rows[0].count),
        issued_books: parseInt(issuedRes.rows[0].count),
        overdue_books: parseInt(overdueRes.rows[0].count),
      },
      top_categories: categoriesRes.rows,
      top_books: topBooksRes.rows,
      monthly_trend: monthly,
      recent_transactions: recentRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/reading-stats/:userId
const readingStats = async (req, res) => {
  try {
    const uid = req.params.userId || req.user.id;
    const [completedRes, currentRes, streakRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM reading_progress WHERE user_id=$1 AND status='completed'`, [uid]),
      query(`SELECT COUNT(*) FROM reading_progress WHERE user_id=$1 AND status='reading'`, [uid]),
      query(`SELECT COUNT(DISTINCT DATE(issued_at)) AS days FROM transactions WHERE user_id=$1 AND issued_at > NOW() - INTERVAL '30 days'`, [uid]),
    ]);
    res.json({
      completed: parseInt(completedRes.rows[0].count),
      reading: parseInt(currentRes.rows[0].count),
      active_days: parseInt(streakRes.rows[0].days),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { dashboard, readingStats };
