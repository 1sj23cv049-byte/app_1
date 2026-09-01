import fs from 'fs';
import path from 'path';
import { uploadsDir } from '../../../../lib/db';

const MIME = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// Serves uploaded plan PDFs and site photos back to the browser. Path
// segments are joined under the fixed uploads directory only — no
// traversal outside it is possible since path.join + the startsWith guard
// below reject anything that resolves elsewhere.
export async function GET(_req, { params }) {
  const rel = params.path.join('/');
  const full = path.join(uploadsDir(), rel);
  if (!full.startsWith(uploadsDir())) {
    return new Response('Not found', { status: 404 });
  }
  if (!fs.existsSync(full)) {
    return new Response('Not found', { status: 404 });
  }
  const ext = path.extname(full).toLowerCase();
  const buffer = fs.readFileSync(full);
  return new Response(buffer, { headers: { 'Content-Type': MIME[ext] || 'application/octet-stream' } });
}
