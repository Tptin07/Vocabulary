const express = require("express");
const router = express.Router();
const db = require("../database");

// GET all test results
router.get("/", (req, res) => {
  try {
    res.json({ success: true, data: db.getAllTestResults() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET stats
router.get("/stats", (req, res) => {
  try {
    res.json({ success: true, data: db.getTestStats() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST - save test result
router.post("/", (req, res) => {
  try {
    const { score, total, duration, mode } = req.body;
    if (score === undefined || total === undefined || duration === undefined)
      return res
        .status(400)
        .json({ success: false, error: "score, total, duration required" });
    const result = db.addTestResult({ score, total, duration, mode });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
