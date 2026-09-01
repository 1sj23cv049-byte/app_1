// Mock AI engine. Stands in for a real vision-capable model until an
// Anthropic API key is wired in (see lib/ai/client.js).
//
// Important: this is NOT a random-number generator pretending to be AI. It
// does genuine best-effort extraction — it reads whatever text layer a PDF
// actually has (pdf-parse) and runs the regex heuristics in stageSchema.js
// against it. A text-based/CAD-exported PDF with labelled dimensions will
// have real fields auto-filled; a scanned/rasterised drawing has no text
// layer to search, so every field correctly falls through to
// missing_fields and the UI prompts the person to enter it. That fallback
// IS the intended behaviour (requirement #3), not a bug — a real vision
// model would do better here, which is exactly why lib/ai/client.js is
// structured so swapping one in later doesn't touch any other file.

import pdfParse from 'pdf-parse';
import { requiredFieldsFor } from './stageSchema';

export async function analyzeDrawing({ stageKey, pdfBuffer }) {
  let text = '';
  try {
    const parsed = await pdfParse(pdfBuffer);
    text = parsed.text || '';
  } catch (e) {
    // Encrypted, malformed, or otherwise unparseable PDF — fall through
    // with empty text so every field becomes a missing-field prompt rather
    // than the request failing outright.
    text = '';
  }

  const fields = requiredFieldsFor(stageKey);
  const extracted = {};
  const missingFields = [];

  for (const field of fields) {
    const match = text.match(field.regex);
    if (match) {
      try {
        extracted[field.key] = field.parse(match);
      } catch {
        missingFields.push(field);
      }
    } else {
      missingFields.push(field);
    }
  }

  return {
    extracted,
    missingFields: missingFields.map((f) => ({ key: f.key, label: f.label, unit: f.unit })),
    textLength: text.length,
    note:
      text.length < 20
        ? 'No extractable text layer found in this PDF (likely a scanned image or exported raster). All fields need to be entered manually below.'
        : `Scanned ${text.length.toLocaleString()} characters of extractable text from the PDF.`
  };
}

export async function generateProgressRemark({ stageKey, description, plannedDays, elapsedDays, hasPhoto }) {
  // Small set of templated, rule-based remarks. Deliberately conservative —
  // it comments on schedule position and documentation completeness, which
  // is genuinely computable, rather than inventing an opinion about work
  // quality it can't actually see.
  const remarks = [];

  if (!hasPhoto) {
    remarks.push('No timestamped/geotagged photo attached to this entry — attach one to support this progress claim.');
  }

  if (plannedDays != null && elapsedDays != null) {
    const diff = elapsedDays - plannedDays;
    if (diff > 3) {
      remarks.push(`Running ${diff} day(s) behind the typical schedule for this stage — check the delay-reason field.`);
    } else if (diff < -1) {
      remarks.push(`Running ahead of the typical schedule for this stage by ${Math.abs(diff)} day(s).`);
    } else {
      remarks.push('On pace with the typical schedule for this stage.');
    }
  }

  const lower = (description || '').toLowerCase();
  if (['footing', 'plinth', 'column', 'beam_slab', 'brickwork'].includes(stageKey)) {
    if (!lower.includes('cur')) {
      remarks.push('Description does not mention curing — confirm the curing checklist for this entry is being followed (min. 7 days per IS 2212:1991 cl. 11.10 for masonry; similar practice applies to RCC).');
    }
  }

  if (remarks.length === 0) remarks.push('Entry logged.');
  return remarks.join(' ');
}
