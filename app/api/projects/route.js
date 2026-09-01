import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getDb } from '../../../lib/db';
import { ensureDistrictSeeded } from '../../../lib/rates';
import { PLACEHOLDER_RATE_DEFAULTS } from '../../../lib/rateDefaults';

export async function GET() {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  return NextResponse.json({ projects });
}

export async function POST(req) {
  const body = await req.json();
  const { name, district } = body;
  if (!name?.trim() || !district?.trim()) {
    return NextResponse.json({ error: 'name and district are required' }, { status: 400 });
  }
  const db = getDb();
  const id = uuid();
  db.prepare('INSERT INTO projects (id, name, district) VALUES (?, ?, ?)').run(id, name.trim(), district.trim());

  // Seed this district with placeholder rates if it has none yet, so the
  // estimator has something to price against immediately. These are clearly
  // labelled placeholders in the Rates screen — edit them to real local
  // prices before relying on any cost total.
  ensureDistrictSeeded(district.trim(), PLACEHOLDER_RATE_DEFAULTS);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  return NextResponse.json({ project });
}
