// Placeholder starting rates seeded for any new district, so the estimator
// has numbers to work with immediately. These are NOT verified local prices
// — they are rough, dated approximations for rural Karnataka construction
// material costs. Go to the Rates screen for a project and correct every
// one of these to the real current price for that district before trusting
// any cost total. The app flags this on the Rates screen so it can't be
// missed.
export const PLACEHOLDER_RATE_DEFAULTS = {
  cement_bag_50kg: 400,
  steel_kg: 68,
  brick_unit: 8,
  sand_cft: 55,
  aggregate_cft: 50
};
