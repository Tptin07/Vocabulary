const express = require('express');
const router = express.Router();
const { all, get, run } = require('../database');

// GET all test results
router.get('/', (req, res) => {
  try {
    const results = all('SELECT * FROM test_results ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET stats
router.get('/stats', (req, res) => {
  try {
    const stats = get(`
      SELECT
        COUNT(*) as total_tests,
        AVG(CAST(score AS FLOAT) / total * 100) as avg_score,
        MAX(CAST(score AS FLOAT) / total * 100) as best_score
      FROM test_results
    `);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST - save test result
router.post('/', (req, res) => {
  try {
    const { score, total, duration, mode = 'test' } = req.body;
    if (score === undefined || total === undefined || duration === undefined) {
      return res.status(400).json({ success: false, error: 'score, total, and duration are required' });
    }

    const result = run(
      `INSERT INTO test_results (score, total, duration, mode, created_at)
       VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
      [score, total, duration, mode]
    );
    const newResult = get('SELECT * FROM test_results WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
