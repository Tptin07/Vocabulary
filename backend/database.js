const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.json");

// Default data structure
function emptyDB() {
  return { words: [], testResults: [], nextWordId: 1, nextTestId: 1 };
}

// Load DB from disk
function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("DB load error:", e.message);
  }
  return emptyDB();
}

// Save DB to disk
function save(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("DB save error:", e.message);
  }
}

// Seed sample words if empty
function seedIfEmpty(db) {
  if (db.words.length > 0) return db;

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const samples = [
    [
      "Ephemeral",
      "Lasting for a very short time",
      "The ephemeral beauty of cherry blossoms.",
      "Adjective",
    ],
    [
      "Ubiquitous",
      "Present everywhere at the same time",
      "Smartphones have become ubiquitous.",
      "Adjective",
    ],
    [
      "Resilient",
      "Able to recover quickly from difficulties",
      "She is a resilient person who never gives up.",
      "Adjective",
    ],
    [
      "Eloquent",
      "Fluent or persuasive in speaking",
      "The lawyer made an eloquent argument.",
      "Adjective",
    ],
    [
      "Benevolent",
      "Well-meaning and kindly",
      "A benevolent leader cares for his people.",
      "Adjective",
    ],
    [
      "Ambiguous",
      "Open to more than one interpretation",
      "The instructions were ambiguous.",
      "Adjective",
    ],
    [
      "Diligent",
      "Having or showing care and effort",
      "She was diligent in her studies.",
      "Adjective",
    ],
    [
      "Pragmatic",
      "Dealing with things sensibly",
      "A pragmatic approach to problem solving.",
      "Adjective",
    ],
  ];

  for (const [term, definition, example, category] of samples) {
    db.words.push({
      id: db.nextWordId++,
      term,
      definition,
      example,
      category,
      created_at: now,
    });
  }

  save(db);
  return db;
}

// Initialize
let _db = load();
_db = seedIfEmpty(_db);

// --- Public API ---

function getDB() {
  return _db;
}

// Words
function getAllWords({ date, category, search } = {}) {
  let words = _db.words;
  if (date) words = words.filter((w) => w.created_at.startsWith(date));
  if (category && category !== "All")
    words = words.filter((w) => w.category === category);
  if (search) {
    const q = search.toLowerCase();
    words = words.filter(
      (w) =>
        w.term.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q),
    );
  }
  return [...words].reverse(); // newest first
}

function getWordsByDate() {
  const map = {};
  for (const w of _db.words) {
    const date = w.created_at.slice(0, 10);
    map[date] = (map[date] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30)
    .map(([date, count]) => ({ date, count }));
}

function getCategories() {
  return [...new Set(_db.words.map((w) => w.category))].sort();
}

function addWord({ term, definition, example = "", category = "General" }) {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const word = {
    id: _db.nextWordId++,
    term: term.trim(),
    definition: definition.trim(),
    example: example.trim(),
    category: category.trim(),
    created_at: now,
  };
  _db.words.push(word);
  save(_db);
  return word;
}

function updateWord(
  id,
  { term, definition, example = "", category = "General" },
) {
  const idx = _db.words.findIndex((w) => w.id === Number(id));
  if (idx === -1) return null;
  _db.words[idx] = {
    ..._db.words[idx],
    term: term.trim(),
    definition: definition.trim(),
    example: example.trim(),
    category: category.trim(),
  };
  save(_db);
  return _db.words[idx];
}

function deleteWord(id) {
  const before = _db.words.length;
  _db.words = _db.words.filter((w) => w.id !== Number(id));
  if (_db.words.length < before) {
    save(_db);
    return true;
  }
  return false;
}

// Test Results
function getAllTestResults() {
  return [..._db.testResults].reverse().slice(0, 50);
}

function getTestStats() {
  const results = _db.testResults;
  if (!results.length) return { total_tests: 0, avg_score: 0, best_score: 0 };
  const pcts = results.map((r) => (r.score / r.total) * 100);
  return {
    total_tests: results.length,
    avg_score: pcts.reduce((a, b) => a + b, 0) / pcts.length,
    best_score: Math.max(...pcts),
  };
}

function addTestResult({ score, total, duration, mode = "test" }) {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const result = {
    id: _db.nextTestId++,
    score: Number(score),
    total: Number(total),
    duration: Number(duration),
    mode,
    created_at: now,
  };
  _db.testResults.push(result);
  save(_db);
  return result;
}

module.exports = {
  getAllWords,
  getWordsByDate,
  getCategories,
  addWord,
  updateWord,
  deleteWord,
  getAllTestResults,
  getTestStats,
  addTestResult,
};
