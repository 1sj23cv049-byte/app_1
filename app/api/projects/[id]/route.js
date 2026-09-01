import { NextResponse } from 'next/server';
import { getDb, STAGES } from '../../../../lib/db';

export async function GET(_req, { params }) {
  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id);
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const plans = db.prepare('SELECT * FROM plan_uploads WHERE project_id = ? ORDER BY uploaded_at DESC').all(params.id);
  const progressCount = db.prepare('SELECT COUNT(*) as c FROM progress_entries WHERE project_id = ?').get(params.id).c;
  const photoCount = db.prepare('SELECT COUNT(*) as c FROM site_photos WHERE project_id = ?').get(params.id).c;

  const stagesWithPlans = new Set(plans.map((p) => p.stage_key));

  return NextResponse.json({
    project,
    stages: STAGES.map((s) => ({ ...s, hasPlan: stagesWithPlans.has(s.key) })),
    plans,
    progressCount,
    photoCount
  });
}
