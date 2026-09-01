import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getDb } from '../../../lib/db';
import { saveUploadedFile } from '../../../lib/uploads';
import { extractRequiredExif } from '../../../lib/exifCheck';

// Mandatory EXIF gate (requirement: "make time stamped and geo tagged
// photos mandatory otherwise reject the upload"). No site_photos row is
// created, and no file is even kept on disk, unless the photo has both a
// capture timestamp and GPS coordinates in its EXIF data.
export async function POST(req) {
  const form = await req.formData();
  const projectId = form.get('projectId');
  const stageKey = form.get('stageKey');
  const file = form.get('file');

  if (!projectId || !stageKey || !file) {
    return NextResponse.json({ error: 'projectId, stageKey and file are required' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const exif = await extractRequiredExif(buffer);

  if (!exif.ok) {
    return NextResponse.json(
      {
        error: 'Photo rejected — missing required EXIF data.',
        problems: exif.problems,
        hint: 'Make sure location services and "embed location" were on in the camera app when this photo was taken, and that it has not been stripped by a messaging app or screenshot.'
      },
      { status: 422 }
    );
  }

  const storedFilename = saveUploadedFile(buffer, file.name || 'photo.jpg', 'photos');

  const db = getDb();
  const id = uuid();
  db.prepare(
    `INSERT INTO site_photos (id, project_id, stage_key, stored_filename, captured_at, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, projectId, stageKey, storedFilename, exif.capturedAt, exif.latitude, exif.longitude);

  return NextResponse.json({ photo: { id, capturedAt: exif.capturedAt, latitude: exif.latitude, longitude: exif.longitude, storedFilename } });
}
