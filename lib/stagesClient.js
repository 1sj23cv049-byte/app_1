// Client-safe copy of the stage list from lib/db.js. lib/db.js imports
// better-sqlite3, which is a native/server-only module and cannot be
// bundled into client components — so anything a 'use client' component
// needs (the stage list, labels) is duplicated here rather than imported
// from lib/db.js. Keep the two lists in sync if you add/rename a stage.

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
