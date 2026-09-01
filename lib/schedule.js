import { getDb, STAGES } from './db';

// Planned-vs-actual duration per stage, for the schedule dashboard.
// "Actual" = span from first to last progress_entries row logged against
// that stage for the project. This is intentionally simple (no separate
// start/end date fields to fill in) — the site log itself is the source of
// truth for how long a stage actually took.
export function getScheduleForProject(projectId) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT stage_key, MIN(entry_date) as first_date, MAX(entry_date) as last_date, COUNT(*) as entry_count
       FROM progress_entries WHERE project_id = ? GROUP BY stage_key`
    )
    .all(projectId);

  const byStage = Object.fromEntries(rows.map((r) => [r.stage_key, r]));

  return STAGES.map((stage) => {
    const actual = byStage[stage.key];
    let actualDays = null;
    if (actual && actual.first_date && actual.last_date) {
      const d1 = new Date(actual.first_date);
      const d2 = new Date(actual.last_date);
      actualDays = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
    }
    const delayEntry = actual
      ? db
          .prepare(`SELECT delay_reason FROM progress_entries WHERE project_id = ? AND stage_key = ? AND delay_reason IS NOT NULL AND delay_reason != '' ORDER BY entry_date DESC LIMIT 1`)
          .get(projectId, stage.key)
      : null;

    return {
      key: stage.key,
      label: stage.label,
      plannedDays: stage.typicalDays,
      actualDays,
      entryCount: actual ? actual.entry_count : 0,
      status: actualDays == null ? 'not_started' : actualDays > stage.typicalDays ? 'delayed' : 'on_track',
      delayReason: delayEntry?.delay_reason || null
    };
  });
}

// Standard curing / essential post-concrete checklist items per stage,
// created against a progress entry when it's logged on a curing-relevant
// stage. Grounded in IS 2212:1991 cl. 11.10 (min. 7-day wet curing) plus
// generally accepted RCC site practice for the others.
export const CHECKLIST_TEMPLATES = {
  footing: ['Curing started (keep wet, min. 7 days)', 'Backfilling only after minimum curing period', 'Formwork removal timing checked'],
  plinth: ['Curing started (keep wet, min. 7 days)', 'DPC (damp-proof course) laid per IS 2212:1991 cl. 8.1.1', 'Plinth level checked against drawing'],
  column: ['Curing started (keep wet, min. 7 days)', 'Formwork/shuttering removed at correct age', 'Verticality checked with plumb bob'],
  beam_slab: ['Curing started (keep wet, min. 7 days)', 'Propping retained for minimum specified period', 'Surface level/camber checked'],
  brickwork: ['Curing started (keep wet, min. 7 days, IS 2212:1991 cl. 11.10)', 'Joints raked for plastering key', 'Verticality and course levels checked']
};
