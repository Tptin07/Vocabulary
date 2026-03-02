const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'vocab.db');

let db = null;

function getDB() {
  return db;
}

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      example TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      mode TEXT NOT NULL DEFAULT 'test',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Seed sample data if empty
  const result = db.exec('SELECT COUNT(*) as cnt FROM words');
  const cnt = result.length > 0 ? result[0].values[0][0] : 0;

  if (cnt === 0) {
    const sampleWords = [
      ['Ephemeral', 'Lasting for a very short time', 'The ephemeral beauty of cherry blossoms.', 'Adjective'],
      ['Ubiquitous', 'Present everywhere at the same time', 'Smartphones have become ubiquitous in modern life.', 'Adjective'],
      ['Resilient', 'Able to recover quickly from difficulties', 'She is a resilient person who never gives up.', 'Adjective'],
      ['Eloquent', 'Fluent or persuasive in speaking or writing', 'The lawyer made an eloquent argument.', 'Adjective'],
      ['Benevolent', 'Well-meaning and kindly', 'A benevolent leader cares for his people.', 'Adjective'],
      ['Ambiguous', 'Open to more than one interpretation', 'The instructions were ambiguous and confusing.', 'Adjective'],
      ['Diligent', 'Having or showing care and effort', 'She was diligent in her studies.', 'Adjective'],
      ['Pragmatic', 'Dealing with things sensibly and realistically', 'A pragmatic approach to problem solving.', 'Adjective'],
    ];

    for (const [term, definition, example, category] of sampleWords) {
      db.run(
        `INSERT INTO words (term, definition, example, category, created_at)
         VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
        [term, definition, example, category]
      );
    }
  }

  save();
  console.log('Database initialized at', DB_PATH);
}

// Save DB to disk
function save() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Helper: run a query and get all rows as objects
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and get one row
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

// Helper: run an INSERT/UPDATE/DELETE and return lastInsertRowid
function run(sql, params = []) {
  db.run(sql, params);
  const rowid = db.exec('SELECT last_insert_rowid() as id')[0];
  const lastInsertRowid = rowid ? rowid.values[0][0] : null;
  save();
  return { lastInsertRowid };
}

module.exports = { initDB, getDB, all, get, run, save };
