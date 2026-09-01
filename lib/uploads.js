import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { uploadsDir } from './db';

// ADR (decision recorded during setup, see improvement-roadmap doc): true
// .dwg is a proprietary binary CAD format with no reliable open-source
// parser. Rather than silently failing on it, we validate strictly here —
// PDF only gets analyzed; anything else (including .dwg) is rejected with a
// clear message asking for a PDF export. This matches the "PDF only for
// now" decision made when scoping this build.
const PDF_MAGIC = Buffer.from('%PDF');

export function assertIsPdf(buffer) {
  if (!buffer || buffer.length < 5) return false;
  return buffer.subarray(0, 4).equals(PDF_MAGIC);
}

export function saveUploadedFile(buffer, originalFilename, subdir = '') {
  const dir = subdir ? path.join(uploadsDir(), subdir) : uploadsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(originalFilename) || '';
  const storedFilename = `${uuid()}${ext}`;
  fs.writeFileSync(path.join(dir, storedFilename), buffer);
  return subdir ? path.join(subdir, storedFilename) : storedFilename;
}

export function readUploadedFile(storedFilename) {
  return fs.readFileSync(path.join(uploadsDir(), storedFilename));
}
