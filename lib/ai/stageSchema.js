// What each construction stage needs extracted from its plan upload before
// an estimate can be produced. "required" fields that extraction can't find
// become missing_fields -> the UI prompts the user to fill them in
// (requirement #3: "response appears to enter the missed out detail").
//
// regex: best-effort patterns used against extractable PDF text to *try* to
// auto-fill a field. This is genuine (if limited) extraction, not a random
// number generator — a text-based PDF plan that labels "M20" or "230 x 230"
// will actually be picked up; a scanned/rasterized plan won't have any text
// layer to search, so every field will legitimately land in missing_fields
// and prompt the user. That's the correct, honest behaviour for a mock
// engine standing in for a real vision-capable model (see lib/ai/mockAI.js).

export const STAGE_FIELDS = {
  footing: [
    { key: 'gradeOfConcrete', label: 'Grade of concrete (e.g. M20)', unit: '', regex: /M\s?(15|20|25|30|35)/i, parse: (m) => `M${m[1]}` },
    { key: 'numberOfFootings', label: 'Number of footings', unit: 'nos', regex: /(\d{1,3})\s*(?:footings|no\.?\s*of\s*footings)/i, parse: (m) => Number(m[1]) },
    { key: 'footingSize_mm', label: 'Footing plan size (assume square, mm)', unit: 'mm', regex: /footing[^\d]{0,20}(\d{3,4})\s*x\s*\d{3,4}/i, parse: (m) => Number(m[1]) },
    { key: 'footingDepth_mm', label: 'Footing depth (mm)', unit: 'mm', regex: /depth[^\d]{0,10}(\d{2,4})\s*mm/i, parse: (m) => Number(m[1]) }
  ],
  plinth: [
    { key: 'gradeOfConcrete', label: 'Grade of concrete (e.g. M15)', unit: '', regex: /M\s?(15|20|25)/i, parse: (m) => `M${m[1]}` },
    { key: 'plinthLength_m', label: 'Total plinth beam length (m)', unit: 'm', regex: /plinth[^\d]{0,20}(\d{1,4}(?:\.\d+)?)\s*m\b/i, parse: (m) => Number(m[1]) },
    { key: 'plinthSize_mm', label: 'Plinth beam cross-section (assume square, mm)', unit: 'mm', regex: /plinth[^\d]{0,20}(\d{3})\s*x\s*\d{3}/i, parse: (m) => Number(m[1]) }
  ],
  column: [
    { key: 'gradeOfConcrete', label: 'Grade of concrete (e.g. M20)', unit: '', regex: /M\s?(15|20|25|30|35)/i, parse: (m) => `M${m[1]}` },
    { key: 'steelGrade', label: 'Steel grade (e.g. Fe415)', unit: '', regex: /Fe\s?(415|500|550)/i, parse: (m) => `Fe${m[1]}` },
    { key: 'numberOfColumns', label: 'Number of columns', unit: 'nos', regex: /(\d{1,3})\s*(?:columns|no\.?\s*of\s*columns)/i, parse: (m) => Number(m[1]) },
    { key: 'columnSize_mm', label: 'Column cross-section (assume square, mm)', unit: 'mm', regex: /column[^\d]{0,20}(\d{3})\s*x\s*\d{3}/i, parse: (m) => Number(m[1]) },
    { key: 'columnHeight_m', label: 'Column height (m)', unit: 'm', regex: /column height[^\d]{0,10}(\d(?:\.\d+)?)/i, parse: (m) => Number(m[1]) }
  ],
  beam_slab: [
    { key: 'gradeOfConcrete', label: 'Grade of concrete (e.g. M20)', unit: '', regex: /M\s?(15|20|25|30)/i, parse: (m) => `M${m[1]}` },
    { key: 'steelGrade', label: 'Steel grade (e.g. Fe415)', unit: '', regex: /Fe\s?(415|500|550)/i, parse: (m) => `Fe${m[1]}` },
    { key: 'slabAreaSqm', label: 'Slab area (m²)', unit: 'm²', regex: /slab[^\d]{0,20}(\d{1,4}(?:\.\d+)?)\s*m(?:2|²|sq)/i, parse: (m) => Number(m[1]) },
    { key: 'slabThickness_mm', label: 'Slab thickness (mm)', unit: 'mm', regex: /slab thickness[^\d]{0,10}(\d{2,4})/i, parse: (m) => Number(m[1]) }
  ],
  brickwork: [
    { key: 'wallLength_m', label: 'Total wall length (m)', unit: 'm', regex: /wall length[^\d]{0,10}(\d{1,4}(?:\.\d+)?)/i, parse: (m) => Number(m[1]) },
    { key: 'wallHeight_m', label: 'Wall height (m)', unit: 'm', regex: /wall height[^\d]{0,10}(\d(?:\.\d+)?)/i, parse: (m) => Number(m[1]) },
    { key: 'wallThickness_mm', label: 'Wall thickness (mm)', unit: 'mm', regex: /wall thickness[^\d]{0,10}(\d{2,3})/i, parse: (m) => Number(m[1]) },
    { key: 'brickClass', label: 'Brick class (e.g. Class 7.5 or 12.5, per IS 2212 Table 1)', unit: '', regex: /class\s?(7\.5|12\.5)/i, parse: (m) => `Class ${m[1]}` }
  ],
  roofing: [
    { key: 'roofAreaSqm', label: 'Roof area (m²)', unit: 'm²', regex: /roof[^\d]{0,20}(\d{1,4}(?:\.\d+)?)\s*m(?:2|²|sq)/i, parse: (m) => Number(m[1]) },
    { key: 'roofType', label: 'Roof type (RCC / AC sheet / tile)', unit: '', regex: /(RCC|AC sheet|tile roof)/i, parse: (m) => m[1] }
  ],
  plastering: [
    { key: 'plasterAreaSqm', label: 'Plaster area (m²)', unit: 'm²', regex: /plaster[^\d]{0,20}(\d{1,5}(?:\.\d+)?)\s*m(?:2|²|sq)/i, parse: (m) => Number(m[1]) },
    { key: 'thickness_mm', label: 'Plaster thickness (mm)', unit: 'mm', regex: /plaster thickness[^\d]{0,10}(\d{1,2})/i, parse: (m) => Number(m[1]) }
  ],
  flooring: [
    { key: 'floorAreaSqm', label: 'Floor area (m²)', unit: 'm²', regex: /floor(?:ing)?[^\d]{0,20}(\d{1,5}(?:\.\d+)?)\s*m(?:2|²|sq)/i, parse: (m) => Number(m[1]) }
  ]
};

export function requiredFieldsFor(stageKey) {
  return STAGE_FIELDS[stageKey] || [];
}
