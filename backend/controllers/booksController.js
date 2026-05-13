const { v4: uuidv4 } = require('uuid');
const { query } = require('../models/db');

// GET /api/books  — list with search, filter, pagination
const listBooks = async (req, res) => {
  try {
    const { search, category, available, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let i = 1;

    if (search) {
      conditions.push(`(title ILIKE $${i} OR author ILIKE $${i} OR isbn = $${i+1})`);
      params.push(`%${search}%`, search);
      i += 2;
    }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    if (available === 'true') { conditions.push(`available_copies > 0`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await query(`SELECT COUNT(*) FROM books ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const booksRes = await query(
      `SELECT b.*, COALESCE(AVG(r.rating),0)::numeric(3,1) AS avg_rating,
              COUNT(r.id) AS review_count
       FROM books b LEFT JOIN reviews r ON r.book_id = b.id
       ${where}
       GROUP BY b.id ORDER BY b.title
       LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({ books: booksRes.rows, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/books/:id
const getBook = async (req, res) => {
  try {
    const { rows: books } = await query(
      `SELECT b.*, COALESCE(AVG(r.rating),0)::numeric(3,1) AS avg_rating,
              COUNT(r.id) AS review_count
       FROM books b LEFT JOIN reviews r ON r.book_id = b.id
       WHERE b.id = $1 GROUP BY b.id`,
      [req.params.id]
    );
    if (!books[0]) return res.status(404).json({ error: 'Book not found' });

    const { rows: reviews } = await query(
      `SELECT r.*, u.name AS user_name FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.book_id = $1 ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    res.json({ ...books[0], reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/books
const createBook = async (req, res) => {
  try {
    const { isbn, title, author, category, description, tags = [],
            total_copies = 1, shelf_location, cover_url, published_year, publisher, pages } = req.body;
    if (!isbn || !title || !author || !category)
      return res.status(400).json({ error: 'isbn, title, author, category are required' });

    const id = uuidv4();
    const { rows } = await query(
      `INSERT INTO books (id,isbn,title,author,category,description,tags,total_copies,
        available_copies,shelf_location,cover_url,published_year,publisher,pages)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, isbn, title, author, category, description, JSON.stringify(tags),
       total_copies, shelf_location, cover_url, published_year, publisher, pages]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'ISBN already exists' });
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/books/:id
const updateBook = async (req, res) => {
  try {
    const fields = ['title','author','category','description','tags','shelf_location',
                    'cover_url','published_year','publisher','pages','total_copies'];
    const updates = [];
    const params = [];
    let i = 1;
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${i++}`);
        params.push(f === 'tags' ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    });
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE books SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Book not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM books WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Book not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/books/categories
const getCategories = async (req, res) => {
  const { rows } = await query(
    'SELECT category, COUNT(*) AS count FROM books GROUP BY category ORDER BY count DESC'
  );
  res.json(rows);
};

module.exports = { listBooks, getBook, createBook, updateBook, deleteBook, getCategories };
