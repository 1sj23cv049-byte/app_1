import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getDb } from '../../../../lib/db';
import { assertIsPdf, saveUploadedFile } from '../../../../lib/uploads';
import { analyzeDrawing } from '../../../../lib/ai/client';

// One upload slot per construction stage (requirement #4: "let there be
// different space to upload different details ... footing, plinth,
// column..."). PDF only — see the ADR comment in lib/uploads.js for why
// .dwg is rejected here rather than silently mishandled.
export async function POST(req) {
  const form = await req.formData();
  const projectId = form.get('projectId');
  const stageKey = form.get('stageKey');
  const file = form.get('file');

  if (!projectId || !stageKey || !file) {
    return NextResponse.json({ error: 'projectId, stageKey and file are required' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalFilename = file.name || 'upload.pdf';

  if (!assertIsPdf(buffer)) {
    return NextResponse.json(
      { error: 'Only PDF plan uploads are analyzed in this version. Please export/print your drawing to PDF and upload that (DWG is not supported — see project notes).' },
      { status: 415 }
    );
  }

  const storedFilename = saveUploadedFile(buffer, originalFilename);

  const db = getDb();
  const planId = uuid();
  db.prepare(
    `INSERT INTO plan_uploads (id, project_id, stage_key, original_filename, stored_filename, file_kind) VALUES (?, ?, ?, ?, ?, 'pdf')`
  ).run(planId, projectId, stageKey, originalFilename, storedFilename);

  const analysis = await analyzeDrawing({ stageKey, pdfBuffer: buffer });

  const analysisId = uuid();
  db.prepare(
    `INSERT INTO drawing_analyses (id, plan_upload_id, extracted_json, missing_fields_json, user_supplied_json)
     VALUES (?, ?, ?, ?, '{}')`
  ).run(analysisId, planId, JSON.stringify(analysis.extracted), JSON.stringify(analysis.missingFields));

  return NextResponse.json({
    plan: { id: planId, stageKey, originalFilename },
    analysis: { id: analysisId, extracted: analysis.extracted, missingFields: analysis.missingFields, note: analysis.note }
  });
}
