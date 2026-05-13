const { query } = require('../models/db');

// GET /api/chatbot/recommendations — collaborative filtering
const getRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    // Get user's preferred categories from borrow history
    const { rows: history } = await query(
      `SELECT b.category, COUNT(*) AS cnt
       FROM transactions t JOIN books b ON b.id = t.book_id
       WHERE t.user_id = $1 GROUP BY b.category ORDER BY cnt DESC LIMIT 3`,
      [req.user.id]
    );
    const topCategories = history.map(h => h.category);
    const { rows: borrowed } = await query(
      'SELECT book_id FROM transactions WHERE user_id = $1', [req.user.id]
    );
    const borrowedIds = borrowed.map(b => b.book_id);

    let recs;
    if (topCategories.length > 0) {
      const cats = topCategories.map((_, i) => `$${i + 2}`).join(',');
      const { rows } = await query(
        `SELECT b.*, COALESCE(AVG(r.rating),0)::numeric(3,1) AS avg_rating
         FROM books b LEFT JOIN reviews r ON r.book_id = b.id
         WHERE b.category = ANY(ARRAY[${cats}])
           AND b.id != ALL($1::uuid[])
           AND b.available_copies > 0
         GROUP BY b.id ORDER BY avg_rating DESC, review_count DESC LIMIT $${topCategories.length + 2}`,
        [borrowedIds.length > 0 ? `{${borrowedIds.join(',')}}` : '{}', ...topCategories, parseInt(limit)]
      );
      recs = rows;
    } else {
      // Cold start: return top-rated available books
      const { rows } = await query(
        `SELECT b.*, COALESCE(AVG(r.rating),0)::numeric(3,1) AS avg_rating
         FROM books b LEFT JOIN reviews r ON r.book_id = b.id
         WHERE b.available_copies > 0
         GROUP BY b.id ORDER BY avg_rating DESC LIMIT $1`,
        [parseInt(limit)]
      );
      recs = rows;
    }
    res.json({ recommendations: recs, based_on_categories: topCategories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/chatbot — AI chatbot intent detection
const chatbot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const msg = message.toLowerCase();
    let intent = 'general';
    let books = [];
    let transactions = [];
    let reply = '';

    if (/(find|search|books? (about|on)|look(ing)? for)/i.test(msg)) {
      intent = 'search';
      const keywords = message.replace(/(find|search|books? about|books? on|look for)/gi, '').trim();
      const { rows } = await query(
        `SELECT b.*, COALESCE(AVG(r.rating),0)::numeric(3,1) AS avg_rating
         FROM books b LEFT JOIN reviews r ON r.book_id = b.id
         WHERE (b.title ILIKE $1 OR b.category ILIKE $1 OR b.description ILIKE $1 OR b.author ILIKE $1)
         GROUP BY b.id LIMIT 5`,
        [`%${keywords}%`]
      );
      books = rows;
      reply = books.length > 0
        ? `I found ${books.length} book${books.length > 1 ? 's' : ''} matching "${keywords}".`
        : `No results for "${keywords}". Try different keywords or browse by category.`;
    } else if (/(due|return|overdue)/i.test(msg)) {
      intent = 'due_dates';
      const { rows } = await query(
        `SELECT t.*, b.title, b.author,
                GREATEST(0, EXTRACT(DAY FROM t.due_date - NOW()))::int AS days_left
         FROM transactions t JOIN books b ON b.id = t.book_id
         WHERE t.user_id = $1 AND t.returned_at IS NULL ORDER BY t.due_date ASC`,
        [req.user.id]
      );
      transactions = rows;
      reply = transactions.length > 0
        ? `You have ${transactions.length} book${transactions.length > 1 ? 's' : ''} checked out.`
        : `You have no books currently checked out. Great job staying on top of things!`;
    } else if (/(recommend|suggest|what should i read)/i.test(msg)) {
      intent = 'recommend';
      const { rows } = await query(
        `SELECT b.* FROM books b WHERE b.available_copies > 0 ORDER BY RANDOM() LIMIT 3`
      );
      books = rows;
      reply = `Based on popular reads, here are my top picks for you:`;
    } else if (/(room|study|book a room)/i.test(msg)) {
      intent = 'study_room';
      reply = `Study rooms can be booked from the Study Rooms section. Rooms 1–5 are available, each seating up to 4 people. Would you like me to check availability for a specific date?`;
    } else if (/(hello|hi|hey|help)/i.test(msg)) {
      intent = 'greeting';
      reply = `Hi! I'm your AI library assistant. I can help you:\n• Find books by topic, author, or title\n• Check your due dates\n• Get reading recommendations\n• Answer questions about study rooms\n\nWhat would you like to do?`;
    } else {
      reply = `I'm not sure I understand. Try asking me to "find books about Python", "check my due dates", or "recommend something to read".`;
    }

    res.json({ success: true, intent, reply, books, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRecommendations, chatbot };
