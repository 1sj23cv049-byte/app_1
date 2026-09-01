// Sanity-check / validation layer that runs on every generated estimate
// before it is shown to the user (roadmap Priority 1, item 2). This is what
// would have caught the reference app's 10x arithmetic bug: instead of
// trusting a total the AI wrote in prose, we recompute it here in plain
// arithmetic and flag any mismatch, plus a few domain sanity bounds.

export function validateEstimate(estimate) {
  const warnings = [];

  // 1. Recompute the subtotal independently — never trust a stored total.
  const recomputed = estimate.items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const recomputedRounded = Math.round(recomputed);
  if (Math.abs(recomputedRounded - estimate.subtotal) > 1) {
    warnings.push({
      level: 'error',
      message: `Subtotal mismatch: displayed ₹${estimate.subtotal.toLocaleString('en-IN')} but line items sum to ₹${recomputedRounded.toLocaleString('en-IN')}. Using the recomputed value.`
    });
    estimate.subtotal = recomputedRounded;
  }

  // 2. Steel percentage sanity range (0.8-2% of concrete volume is the
  // generally accepted structural range for RCC members).
  for (const it of estimate.items) {
    if (it._steelPercentRange) {
      const { min, max } = it._steelPercentRange;
      if (it._steelPercent < min || it._steelPercent > max) {
        warnings.push({
          level: 'warning',
          message: `Steel content (${it._steelPercent}%) is outside the typical ${min}-${max}% structural range for this member — verify against detailed RCC design (IS 456) before using this figure.`
        });
      }
    }
  }

  // 3. Missing rate data — an item with no rate can't contribute to the
  // subtotal, so flag it rather than silently showing an incomplete total.
  const missingRates = estimate.items.filter((it) => it.rate == null && it.unit !== 'm³' && it.unit !== 'm²');
  if (missingRates.length > 0) {
    warnings.push({
      level: 'warning',
      message: `No rate on file for: ${missingRates.map((it) => it.material).join(', ')}. Add these to the district rate table for a complete cost total.`
    });
  }

  // 4. Zero/negative or implausibly large quantities usually mean a missing
  // or mis-entered input field rather than a real design value.
  for (const it of estimate.items) {
    if (it.quantity != null && (it.quantity < 0 || !isFinite(it.quantity))) {
      warnings.push({ level: 'error', message: `Invalid quantity computed for "${it.material}" — check the input dimensions.` });
    }
  }
  if (estimate.concreteVolumeM3 != null && estimate.concreteVolumeM3 > 500) {
    warnings.push({
      level: 'warning',
      message: `Concrete volume for this stage (${estimate.concreteVolumeM3} m³) is unusually large for a single rural housing unit — double check the entered dimensions/counts.`
    });
  }

  return { ...estimate, warnings, isValid: !warnings.some((w) => w.level === 'error') };
}
