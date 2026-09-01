import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

// Saves the user's answers for whatever fields the (mock or real) AI
// extraction could not find in the drawing — requirement #3: "in case
// there is any information that's not specified, a response appears to
// enter the missed out detail". planId here is the drawing_analyses id
// returned from the upload step.
export async function POST(req, { params }) {
  const body = await req.json();
  const db = getDb();
  const existing = db.prepare('SELECT * FROM drawing_analyses WHERE id = ?').get(params.id);
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const userSupplied = { ...JSON.parse(existing.user_supplied_json || '{}'), ...body };
  db.prepare('UPDATE drawing_analyses SET user_supplied_json = ? WHERE id = ?').run(JSON.stringify(userSupplied), params.id);

  return NextResponse.json({ ok: true, userSupplied });
}
