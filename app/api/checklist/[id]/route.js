import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function PATCH(req, { params }) {
  const body = await req.json();
  const db = getDb();
  db.prepare('UPDATE checklist_items SET checked = ? WHERE id = ?').run(body.checked ? 1 : 0, params.id);
  return NextResponse.json({ ok: true });
}
