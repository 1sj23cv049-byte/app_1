// Optional helper: creates one demo project with the placeholder rate table
// already applied, so you have something to click into immediately after
// `npm run dev` instead of an empty project list. Run with `npm run seed`.
//
// This uses require() rather than the app's ESM lib/ files because it runs
// standalone under plain Node, not through Next's bundler.

const path = require('path');
const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'civilverify.db');

const fs = require('fs');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, district TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS material_rates (
    id TEXT PRIMARY KEY, district TEXT NOT NULL, material TEXT NOT NULL,
    unit_label TEXT NOT NULL, rate_inr REAL NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(district, material)
  );
`);

const district = 'Bengaluru Rural (edit me)';
const existing = db.prepare('SELECT * FROM projects WHERE district = ?').get(district);

if (!existing) {
  const id = randomUUID();
  db.prepare('INSERT INTO projects (id, name, district) VALUES (?, ?, ?)').run(id, 'Demo PMAY House', district);

  const defaults = { cement_bag_50kg: 400, steel_kg: 68, brick_unit: 8, sand_cft: 55, aggregate_cft: 50 };
  const units = { cement_bag_50kg: 'per bag', steel_kg: 'per kg', brick_unit: 'per brick', sand_cft: 'per cft', aggregate_cft: 'per cft' };
  const insertRate = db.prepare(
    'INSERT INTO material_rates (id, district, material, unit_label, rate_inr) VALUES (?, ?, ?, ?, ?)'
  );
  for (const [material, rate] of Object.entries(defaults)) {
    insertRate.run(randomUUID(), district, material, units[material], rate);
  }
  console.log(`Seeded demo project "${id}" in district "${district}". Run npm run dev and open http://localhost:3000`);
} else {
  console.log('Demo project already exists — nothing to do.');
}
