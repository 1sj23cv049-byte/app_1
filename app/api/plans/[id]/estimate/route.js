import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getRatesForDistrict } from '../../../../../lib/rates';
import { estimateStage } from '../../../../../lib/estimator';
import { validateEstimate } from '../../../../../lib/validation';

// Recomputes the material/cost estimate for a plan's analysis on every
// request rather than caching a stored total — the estimate should always
// reflect the current rate table and the latest user-supplied field values,
// and recomputing from scratch is also what keeps the validation layer
// meaningful (it's re-checking real numbers, not a stale cached figure).
export async function GET(_req, { params }) {
  const db = getDb();
  const analysis = db.prepare('SELECT * FROM drawing_analyses WHERE id = ?').get(params.id);
  if (!analysis) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const plan = db.prepare('SELECT * FROM plan_uploads WHERE id = ?').get(analysis.plan_upload_id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(plan.project_id);

  const extracted = JSON.parse(analysis.extracted_json || '{}');
  const userSupplied = JSON.parse(analysis.user_supplied_json || '{}');
  const params_ = { ...extracted, ...userSupplied };

  const rateTable = getRatesForDistrict(project.district);
  const rawEstimate = estimateStage(plan.stage_key, params_, rateTable);
  const estimate = validateEstimate(rawEstimate);

  return NextResponse.json({ estimate, params: params_, district: project.district });
}
