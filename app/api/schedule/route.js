import { NextResponse } from 'next/server';
import { getScheduleForProject } from '../../../lib/schedule';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  return NextResponse.json({ schedule: getScheduleForProject(projectId) });
}
