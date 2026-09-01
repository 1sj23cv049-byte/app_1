// Central SQLite database setup. Using better-sqlite3 (synchronous) which is
// the right fit for a Next.js server-side app route / server action — no
// connection pooling headaches, one file on disk, easy to back up.
//
// This is the "app's own storage" backend chosen instead of Google Drive:
// uploaded PDFs and site photos are saved to disk under data/uploads/ and
// referenced by path from these tables, so everything survives reloads and
// works across devices without needing a Google account.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'civilverify.db');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let _db;

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

export function uploadsDir() {
  return UPLOADS_DIR;
}

// Construction stages, in build order. Used both for the upload slots
// (footing / plinth / column / ...) and for the step-by-step plan and the
// schedule dashboard. "typicalDays" is a rough default duration used to seed
// the planned-vs-actual schedule dashboard until the user edits it per
// project.
export const STAGES = [
  { key: 'site_layout', label: 'Site Layout & Marking', typicalDays: 2 },
  { key: 'excavation', label: 'Excavation', typicalDays: 4 },
  { key: 'footing', label: 'Footing', typicalDays: 6 },
  { key: 'plinth', label: 'Plinth', typicalDays: 5 },
  { key: 'column', label: 'Columns (up to plinth/floor level)', typicalDays: 8 },
  { key: 'beam_slab', label: 'Beams & Slab', typicalDays: 10 },
  { key: 'brickwork', label: 'Brickwork / Masonry', typicalDays: 14 },
  { key: 'roofing', label: 'Roofing', typicalDays: 6 },
  { key: 'plastering', label: 'Plastering', typicalDays: 8 },
  { key: 'flooring', label: 'Flooring & Finishing', typicalDays: 10 },
  { key: 'electrical_plumbing', label: 'Electrical & Plumbing', typicalDays: 7 },
  { key: 'painting_handover', label: 'Painting & Handover', typicalDays: 5 }
];

// Stages after which curing / essential-task checklists apply (i.e. after
// concrete or mortar work is placed) per IS 2212:1991 clause 11.10 (7-day
// wet curing for brickwork) and standard RCC curing practice.
export const CURING_STAGES = ['footing', 'plinth', 'column', 'beam_slab', 'brickwork'];

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- One row per (project, stage) plan upload. PDF only (see ADR in
    -- lib/uploads.js) — DWG is out of scope for this version per project
    -- decision; a DWG file can still be attached for record-keeping but is
    -- not analyzed.
    CREATE TABLE IF NOT EXISTS plan_uploads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stage_key TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      file_kind TEXT NOT NULL DEFAULT 'pdf', -- 'pdf' | 'dwg_record_only'
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Structured extraction result for a plan upload (the "AI reads the
    -- drawing" step). Stored as JSON. missing_fields tracks anything the
    -- analysis could not find, which the UI turns into a form prompting the
    -- user to fill in the missed-out detail (requirement #3).
    CREATE TABLE IF NOT EXISTS drawing_analyses (
      id TEXT PRIMARY KEY,
      plan_upload_id TEXT NOT NULL REFERENCES plan_uploads(id) ON DELETE CASCADE,
      extracted_json TEXT NOT NULL,
      missing_fields_json TEXT NOT NULL DEFAULT '[]',
      user_supplied_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Site progress log entries. Multiple entries per day are allowed
    -- (requirement: calendar shows multiple works per day). Each entry can
    -- optionally reference an uploaded, EXIF-validated site photo.
    CREATE TABLE IF NOT EXISTS progress_entries (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stage_key TEXT NOT NULL,
      entry_date TEXT NOT NULL, -- YYYY-MM-DD, from photo EXIF capture time when a photo is attached
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      photo_id TEXT REFERENCES site_photos(id),
      ai_remark TEXT,
      delay_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Curing / essential-task checklist items, tied to a progress entry on a
    -- curing-relevant stage (footing/plinth/column/beam_slab/brickwork).
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      progress_entry_id TEXT NOT NULL REFERENCES progress_entries(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0
    );

    -- Site photos are mandatory-timestamped and geotagged (EXIF). An upload
    -- with missing EXIF capture time or GPS is rejected before a row is ever
    -- created here — see app/api/photos/route.js.
    CREATE TABLE IF NOT EXISTS site_photos (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      stage_key TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      captured_at TEXT NOT NULL,   -- ISO timestamp from EXIF DateTimeOriginal
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Editable material rate table, per district. Seeded with one fixed
    -- district's placeholder rates (see scripts/seed.js) — edit freely from
    -- the Rates screen.
    CREATE TABLE IF NOT EXISTS material_rates (
      id TEXT PRIMARY KEY,
      district TEXT NOT NULL,
      material TEXT NOT NULL,       -- e.g. 'cement_bag_50kg', 'steel_kg', 'brick_unit', 'sand_cft', 'aggregate_cft'
      unit_label TEXT NOT NULL,
      rate_inr REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(district, material)
    );
  `);
}
