import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getDb, STAGES, CURING_STAGES } from '../../../lib/db';
import { generateProgressRemark } from '../../../lib/ai/client';
import { CHECKLIST_TEMPLATES, getScheduleForProject } from '../../../lib/schedule';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const db = getDb();
  const entries = db
    .prepare(
      `SELECT pe.*, sp.stored_filename as photo_filename, sp.latitude, sp.longitude
       FROM progress_entries pe LEFT JOIN site_photos sp ON sp.id = pe.photo_id
       WHERE pe.project_id = ? ORDER BY pe.entry_date DESC, pe.created_at DESC`
    )
    .all(projectId);

  const withChecklist = entries.map((e) => ({
    ...e,
    checklist: db.prepare('SELECT * FROM checklist_items WHERE progress_entry_id = ?').all(e.id)
  }));

  return NextResponse.json({ entries: withChecklist });
}

// Multiple entries per day are explicitly supported (requirement: "also
// allow multiple works per day") — entry_date is derived from the attached
// photo's EXIF capture date when present, otherwise from an explicit date
// the caller supplies (defaults to today), so several log entries can share
// the same day without conflict.
export async function POST(req) {
  const body = await req.json();
  const { projectId, stageKey, title, description, photoId, delayReason, entryDate } = body;
  if (!projectId || !stageKey || !title) {
    return NextResponse.json({ error: 'projectId, stageKey and title are required' }, { status: 400 });
  }

  const db = getDb();
  let resolvedDate = entryDate;
  let hasPhoto = false;
  if (photoId) {
    const photo = db.prepare('SELECT * FROM site_photos WHERE id = ?').get(photoId);
    if (photo) {
      resolvedDate = photo.captured_at.slice(0, 10);
      hasPhoto = true;
    }
  }
  if (!resolvedDate) resolvedDate = new Date().toISOString().slice(0, 10);

  const schedule = getScheduleForProject(projectId).find((s) => s.key === stageKey);
  const elapsedDays = schedule?.actualDays ?? null;

  const remark = await generateProgressRemark({
    stageKey,
    description,
    plannedDays: schedule?.plannedDays ?? null,
    elapsedDays,
    hasPhoto
  });

  const id = uuid();
  db.prepare(
    `INSERT INTO progress_entries (id, project_id, stage_key, entry_date, title, description, photo_id, ai_remark, delay_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, projectId, stageKey, resolvedDate, title, description || '', photoId || null, remark, delayReason || null);

  let checklist = [];
  if (CURING_STAGES.includes(stageKey)) {
    const items = CHECKLIST_TEMPLATES[stageKey] || [];
    const insert = db.prepare('INSERT INTO checklist_items (id, progress_entry_id, label, checked) VALUES (?, ?, ?, 0)');
    for (const label of items) {
      const itemId = uuid();
      insert.run(itemId, id, label);
      checklist.push({ id: itemId, label, checked: 0 });
    }
  }

  const entry = db.prepare('SELECT * FROM progress_entries WHERE id = ?').get(id);
  return NextResponse.json({ entry: { ...entry, checklist } });
}
