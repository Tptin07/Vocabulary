const express = require("express");
const router = express.Router();
const db = require("../database");

// GET all words
router.get("/", (req, res) => {
  try {
    const { date, category, search } = req.query;
    const words = db.getAllWords({ date, category, search });
    res.json({ success: true, data: words });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET words grouped by date
router.get("/by-date", (req, res) => {
  try {
    res.json({ success: true, data: db.getWordsByDate() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET categories
router.get("/categories", (req, res) => {
  try {
    res.json({ success: true, data: db.getCategories() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST - add new word
router.post("/", (req, res) => {
  try {
    const { term, definition, example, category } = req.body;
    if (!term || !definition)
      return res
        .status(400)
        .json({ success: false, error: "Term and definition are required" });
    const word = db.addWord({ term, definition, example, category });
    res.status(201).json({ success: true, data: word });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT - update word
router.put("/:id", (req, res) => {
  try {
    const { term, definition, example, category } = req.body;
    if (!term || !definition)
      return res
        .status(400)
        .json({ success: false, error: "Term and definition are required" });
    const word = db.updateWord(req.params.id, {
      term,
      definition,
      example,
      category,
    });
    if (!word)
      return res.status(404).json({ success: false, error: "Word not found" });
    res.json({ success: true, data: word });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE - remove word
router.delete("/:id", (req, res) => {
  try {
    db.deleteWord(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
