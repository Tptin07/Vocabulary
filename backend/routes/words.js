const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database');

// GET all words (with optional date/category/search filter)
router.get('/', (req, res) => {
  try {
    const { date, category, search } = req.query;
    let query = 'SELECT * FROM words WHERE 1=1';
    const params = [];

    if (date) {
      query += " AND date(created_at) = date(?)";
      params.push(date);
    }
    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (term LIKE ? OR definition LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const words = all(query, params);
    res.json({ success: true, data: words });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET words grouped by date (for History page)
router.get('/by-date', (req, res) => {
  try {
    const rows = all(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM words
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET categories
router.get('/categories', (req, res) => {
  try {
    const rows = all('SELECT DISTINCT category FROM words ORDER BY category');
    const categories = rows.map(r => r.category);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST - add new word
router.post('/', (req, res) => {
  try {
    const { term, definition, example = '', category = 'General' } = req.body;
    if (!term || !definition) {
      return res.status(400).json({ success: false, error: 'Term and definition are required' });
    }

    const result = run(
      `INSERT INTO words (term, definition, example, category, created_at)
       VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
      [term.trim(), definition.trim(), example.trim(), category.trim()]
    );
    const newWord = get('SELECT * FROM words WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newWord });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT - update word
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { term, definition, example = '', category = 'General' } = req.body;
    if (!term || !definition) {
      return res.status(400).json({ success: false, error: 'Term and definition are required' });
    }

    run(
      `UPDATE words SET term = ?, definition = ?, example = ?, category = ? WHERE id = ?`,
      [term.trim(), definition.trim(), example.trim(), category.trim(), id]
    );
    const updated = get('SELECT * FROM words WHERE id = ?', [id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE - remove word
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    run('DELETE FROM words WHERE id = ?', [id]);
    res.json({ success: true, message: `Word ${id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
