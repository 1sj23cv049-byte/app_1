import { getDb } from './db';

// The five materials the estimator prices. unit_label is shown in the Rates
// screen; `material` is the stable key used everywhere else.
export const RATE_MATERIALS = [
  { material: 'cement_bag_50kg', label: 'Cement (50kg bag)', unit_label: 'per bag' },
  { material: 'steel_kg', label: 'Reinforcement steel', unit_label: 'per kg' },
  { material: 'brick_unit', label: 'Brick (modular)', unit_label: 'per brick' },
  { material: 'sand_cft', label: 'Sand', unit_label: 'per cft' },
  { material: 'aggregate_cft', label: 'Coarse aggregate', unit_label: 'per cft' }
];

export function getRatesForDistrict(district) {
  const db = getDb();
  return db.prepare('SELECT * FROM material_rates WHERE district = ?').all(district);
}

export function listDistricts() {
  const db = getDb();
  return db.prepare('SELECT DISTINCT district FROM material_rates ORDER BY district').all().map((r) => r.district);
}

export function upsertRate(district, material, rate_inr) {
  const db = getDb();
  const meta = RATE_MATERIALS.find((m) => m.material === material);
  const unit_label = meta ? meta.unit_label : '';
  db.prepare(
    `INSERT INTO material_rates (id, district, material, unit_label, rate_inr, updated_at)
     VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(district, material) DO UPDATE SET rate_inr = excluded.rate_inr, updated_at = datetime('now')`
  ).run(district, material, unit_label, rate_inr);
}

export function ensureDistrictSeeded(district, defaults) {
  const db = getDb();
  const existing = getRatesForDistrict(district);
  if (existing.length > 0) return;
  for (const [material, rate_inr] of Object.entries(defaults)) {
    upsertRate(district, material, rate_inr);
  }
}
