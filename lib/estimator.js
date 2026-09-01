// Material quantity + cost estimation, run entirely in code — never inside
// the AI/LLM layer. This is the fix for the #1 bug found in the reference
// app review: a 10x arithmetic error (476 bags x Rs 420 shown as Rs
// 20,00,000 instead of ~Rs 2,00,000) happened because the model was asked to
// both read the drawing AND do the multiplication in free text. Here the
// (mock or real) AI layer only ever returns structured parameters; every
// quantity and cost figure below is computed by this plain JS module and
// then re-checked by validateEstimate() before being shown to the user.

import isCodeClauses from './ai/isCodeClauses.json';

// Standard thumb-rule cement/sand/aggregate content per m3 of wet concrete,
// by nominal mix grade (dry-volume factor 1.54 already applied). These are
// widely used civil-engineering estimation thumb rules, NOT a verbatim IS
// 456 clause — IS 456 (concrete design) is not one of the codes loaded into
// this project's IS-code library, so we deliberately do NOT attribute this
// table to a specific IS clause. Anywhere we DO cite a clause below, it is
// pulled from lib/ai/isCodeClauses.json, which was extracted from the actual
// IS-code PDFs attached to this project.
const MIX_THUMB_RULES = {
  M15: { ratio: '1:2:4', cementBagsPerM3: 6.4, sandM3PerM3: 0.44, aggM3PerM3: 0.88 },
  M20: { ratio: '1:1.5:3', cementBagsPerM3: 7.9, sandM3PerM3: 0.42, aggM3PerM3: 0.84 },
  M25: { ratio: '1:1:2', cementBagsPerM3: 9.6, sandM3PerM3: 0.42, aggM3PerM3: 0.84 }
};

const STEEL_PERCENT_OF_CONCRETE = {
  footing: { min: 0.5, typical: 0.7, max: 0.8 },
  plinth: { min: 0.6, typical: 0.9, max: 1.2 },
  column: { min: 0.8, typical: 1.3, max: 2.0 },
  beam_slab: { min: 0.8, typical: 1.1, max: 1.5 }
};

const STEEL_DENSITY_KG_PER_M3 = 7850; // IS 875-1:1987, Table 1

function clause(code, key) {
  const entry = isCodeClauses[code];
  if (!entry || !entry.clauses[key]) return null;
  return { code, clause: key, text: entry.clauses[key] };
}

function round(n, dp = 2) {
  const f = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * f) / f;
}

function rate(rateTable, material) {
  const r = rateTable.find((x) => x.material === material);
  return r ? r.rate_inr : null;
}

function concreteMaterials(volumeM3, gradeKey, rateTable, citations) {
  const mix = MIX_THUMB_RULES[gradeKey] || MIX_THUMB_RULES.M20;
  const cementBags = volumeM3 * mix.cementBagsPerM3;
  const sandM3 = volumeM3 * mix.sandM3PerM3;
  const aggM3 = volumeM3 * mix.aggM3PerM3;

  const cementRate = rate(rateTable, 'cement_bag_50kg');
  const sandRate = rate(rateTable, 'sand_cft');
  const aggRate = rate(rateTable, 'aggregate_cft');
  const CFT_PER_M3 = 35.3147;

  const items = [
    {
      material: `Cement (for ${gradeKey} concrete, mix ${mix.ratio})`,
      quantity: round(cementBags, 1),
      unit: 'bags (50kg)',
      rate: cementRate,
      amount: cementRate != null ? round(cementBags * cementRate, 0) : null,
      note: 'Thumb-rule dry-volume method (factor 1.54), not a direct IS 456 clause quotation.'
    },
    {
      material: 'Sand (fine aggregate)',
      quantity: round(sandM3 * CFT_PER_M3, 1),
      unit: 'cft',
      rate: sandRate,
      amount: sandRate != null ? round(sandM3 * CFT_PER_M3 * sandRate, 0) : null,
      note: citations.push(clause('IS 383:1970', 'Table 4')) && 'Fine aggregate grading per IS 383:1970, Table 4.'
    },
    {
      material: 'Coarse aggregate',
      quantity: round(aggM3 * CFT_PER_M3, 1),
      unit: 'cft',
      rate: aggRate,
      amount: aggRate != null ? round(aggM3 * CFT_PER_M3 * aggRate, 0) : null,
      note: citations.push(clause('IS 383:1970', '3.3')) && 'Aggregate crushing value limit per IS 383:1970, cl. 3.3 (<=45% for general concrete).'
    }
  ];
  return items;
}

function steelMaterial(volumeM3, stageKey, rateTable, citations) {
  const pct = STEEL_PERCENT_OF_CONCRETE[stageKey] || STEEL_PERCENT_OF_CONCRETE.column;
  const steelVolumeM3 = volumeM3 * (pct.typical / 100);
  const steelKg = steelVolumeM3 * STEEL_DENSITY_KG_PER_M3;
  const steelRate = rate(rateTable, 'steel_kg');
  citations.push(clause('IS 875-1:1987', 'Table 1 - Cement concrete, reinforced'));
  return {
    material: `Reinforcement steel (${pct.typical}% of concrete volume, thumb-rule for ${stageKey})`,
    quantity: round(steelKg, 1),
    unit: 'kg',
    rate: steelRate,
    amount: steelRate != null ? round(steelKg * steelRate, 0) : null,
    note: `Typical range for this member type: ${pct.min}-${pct.max}% of concrete volume. Flagged if outside range — see validation.`,
    _steelPercent: pct.typical,
    _steelPercentRange: pct
  };
}

export function estimateStage(stageKey, params, rateTable) {
  const citations = [];
  const items = [];
  let concreteVolumeM3 = 0;

  if (stageKey === 'footing') {
    const size = (params.footingSize_mm || 0) / 1000;
    const depth = (params.footingDepth_mm || 0) / 1000;
    const count = params.numberOfFootings || 0;
    concreteVolumeM3 = size * size * depth * count;
    citations.push(clause('IS 1904:1986', '7.1'));
    citations.push(clause('IS 1904:1986', '18.1'));
    items.push({
      material: `Concrete for ${count} footing(s), ${params.footingSize_mm}x${params.footingSize_mm}mm x ${params.footingDepth_mm}mm deep`,
      quantity: round(concreteVolumeM3, 3),
      unit: 'm³',
      rate: null,
      amount: null,
      note: 'Sub-items below (cement/sand/aggregate/steel) computed from this volume.'
    });
    items.push(...concreteMaterials(concreteVolumeM3, params.gradeOfConcrete, rateTable, citations));
    items.push(steelMaterial(concreteVolumeM3, 'footing', rateTable, citations));
  } else if (stageKey === 'plinth') {
    const size = (params.plinthSize_mm || 0) / 1000;
    const length = params.plinthLength_m || 0;
    concreteVolumeM3 = size * size * length;
    citations.push(clause('IS 2212:1991', '6.8.4'));
    citations.push(clause('IS 2212:1991', '8.1.1(a)'));
    items.push({
      material: `Concrete for plinth beam, ${params.plinthSize_mm}x${params.plinthSize_mm}mm x ${length}m run`,
      quantity: round(concreteVolumeM3, 3),
      unit: 'm³',
      rate: null,
      amount: null,
      note: 'Plinth protection / DPC per IS 2212:1991 cl. 8.1.1(a): 10mm nominal aggregate, mix 1:2:4, min 4cm thick.'
    });
    items.push(...concreteMaterials(concreteVolumeM3, params.gradeOfConcrete, rateTable, citations));
    items.push(steelMaterial(concreteVolumeM3, 'plinth', rateTable, citations));
  } else if (stageKey === 'column') {
    const size = (params.columnSize_mm || 0) / 1000;
    const height = params.columnHeight_m || 0;
    const count = params.numberOfColumns || 0;
    concreteVolumeM3 = size * size * height * count;
    citations.push(clause('IS 1904:1986', '13.2'));
    items.push({
      material: `Concrete for ${count} column(s), ${params.columnSize_mm}x${params.columnSize_mm}mm x ${height}m high`,
      quantity: round(concreteVolumeM3, 3),
      unit: 'm³',
      rate: null,
      amount: null,
      note: `Steel grade specified: ${params.steelGrade || 'not specified'}.`
    });
    items.push(...concreteMaterials(concreteVolumeM3, params.gradeOfConcrete, rateTable, citations));
    items.push(steelMaterial(concreteVolumeM3, 'column', rateTable, citations));
  } else if (stageKey === 'beam_slab') {
    const area = params.slabAreaSqm || 0;
    const thickness = (params.slabThickness_mm || 0) / 1000;
    concreteVolumeM3 = area * thickness;
    citations.push(clause('IS 875-2:1987', 'Table 1(i)(a)1'));
    citations.push(clause('IS 875-2:1987', 'Table 2(i)'));
    items.push({
      material: `Concrete for slab, ${area}m² x ${params.slabThickness_mm}mm thick`,
      quantity: round(concreteVolumeM3, 3),
      unit: 'm³',
      rate: null,
      amount: null,
      note: 'Imposed floor load design values per IS 875-2:1987 apply to structural design, not quantity take-off — cited here for reference.'
    });
    items.push(...concreteMaterials(concreteVolumeM3, params.gradeOfConcrete, rateTable, citations));
    items.push(steelMaterial(concreteVolumeM3, 'beam_slab', rateTable, citations));
  } else if (stageKey === 'brickwork') {
    const length = params.wallLength_m || 0;
    const height = params.wallHeight_m || 0;
    const thickness = (params.wallThickness_mm || 0) / 1000;
    const wallVolumeM3 = length * height * thickness;
    // Standard thumb rule: ~500 modular bricks per m3 of brickwork (allowing
    // for 10mm mortar joints per IS 2212:1991 cl. 6.4.1), less ~30% for
    // mortar volume.
    const brickVolumeM3 = wallVolumeM3 * 0.7;
    const bricksPerM3 = 500;
    const numberOfBricks = brickVolumeM3 * bricksPerM3;
    const mortarM3 = wallVolumeM3 * 0.3;
    const CFT_PER_M3 = 35.3147;
    citations.push(clause('IS 2212:1991', '6.4.1'));
    citations.push(clause('IS 2212:1991', 'Table 1'));
    citations.push(clause('IS 2212:1991', '11.10'));
    const brickRate = rate(rateTable, 'brick_unit');
    const cementRate = rate(rateTable, 'cement_bag_50kg');
    const sandRate = rate(rateTable, 'sand_cft');
    // Mortar 1:6 thumb rule: ~1.8 bags cement + ~14.5 cft sand per m3 mortar.
    const mortarCementBags = mortarM3 * 1.8;
    const mortarSandCft = mortarM3 * 14.5;
    items.push({
      material: `Wall volume, ${length}m x ${height}m x ${params.wallThickness_mm}mm thick`,
      quantity: round(wallVolumeM3, 3),
      unit: 'm³',
      rate: null,
      amount: null,
      note: `Brick class per project spec: ${params.brickClass || 'not specified'} — see IS 2212:1991 Table 1 for selection guidance by exposure.`
    });
    items.push({
      material: 'Bricks (modular, ~500/m³ net of mortar per IS 2212:1991 cl. 6.4.1 joint thickness)',
      quantity: Math.ceil(numberOfBricks),
      unit: 'nos',
      rate: brickRate,
      amount: brickRate != null ? round(numberOfBricks * brickRate, 0) : null,
      note: null
    });
    items.push({
      material: 'Cement for masonry mortar (1:6 mix, thumb-rule)',
      quantity: round(mortarCementBags, 1),
      unit: 'bags (50kg)',
      rate: cementRate,
      amount: cementRate != null ? round(mortarCementBags * cementRate, 0) : null,
      note: null
    });
    items.push({
      material: 'Sand for masonry mortar',
      quantity: round(mortarSandCft, 1),
      unit: 'cft',
      rate: sandRate,
      amount: sandRate != null ? round(mortarSandCft * sandRate, 0) : null,
      note: 'Curing required for at least 7 days after laying, commencing 24h after each course (IS 2212:1991 cl. 11.10).'
    });
  } else {
    // roofing / plastering / flooring: simpler area-based line items,
    // material-agnostic since these vary widely by finish choice — the app
    // still logs the stage and schedule even where a full cost breakdown
    // isn't modelled yet.
    items.push({
      material: `${stageKey} — area-based item`,
      quantity: params.roofAreaSqm || params.plasterAreaSqm || params.floorAreaSqm || 0,
      unit: 'm²',
      rate: null,
      amount: null,
      note: 'Detailed material breakdown for this stage is not yet modelled — logged for schedule tracking. Extend lib/estimator.js to add it.'
    });
  }

  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const dedupedCitations = dedupe(citations.filter(Boolean));

  return {
    stageKey,
    concreteVolumeM3: round(concreteVolumeM3, 3),
    items,
    subtotal: round(subtotal, 0),
    citations: dedupedCitations
  };
}

function dedupe(arr) {
  const seen = new Set();
  return arr.filter((c) => {
    const k = `${c.code}::${c.clause}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
