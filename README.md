# CivilVerify

AI-assisted construction monitoring, quality check and work verification for
rural housing projects. Built as the next version of the CivilVerify AI
reference app, fixing the issues found in that review and adding the
features that app was missing (real progress tracking, IS-code-cited
estimation, photo authenticity checks, planned-vs-actual scheduling).

## Running it

This app needs `npm install` run somewhere with normal internet access —
it was written in a sandboxed environment that couldn't reach the npm
registry, so it has **not** been run yet. On your own machine:

```bash
npm install
cp .env.example .env.local     # defaults to mock AI, no key needed yet
npm run seed                    # optional: creates one demo project to click into
npm run dev
```

Then open http://localhost:3000.

## How it's built

- **Next.js 14 (App Router), plain JavaScript** — server API routes under
  `app/api/**`, pages under `app/**`.
- **SQLite (better-sqlite3)** for storage — one file at `data/civilverify.db`,
  created automatically on first run. Uploaded PDFs and photos are saved to
  `data/uploads/`. This is the "app's own storage" option (not Google
  Drive) — no Google account needed, works out of the box.
- **Mock AI by default** (`lib/ai/mockAI.js`) — no API key required to try
  every screen. It does real PDF text extraction (via `pdf-parse`) and
  regex-based field extraction, so a text-based/CAD-exported PDF plan will
  actually get some fields auto-filled; a scanned drawing won't have any
  text layer to search, so everything correctly falls through to the
  missing-fields form. That's the intended behaviour, not a bug — see the
  comment at the top of `lib/ai/mockAI.js`.
- **Real AI**: get an Anthropic API key (see below), set
  `USE_MOCK_AI=false` and `ANTHROPIC_API_KEY=...` in `.env.local`, then
  implement the sketch already written in `lib/ai/client.js`. No other file
  needs to change — every call site imports from `lib/ai/client.js` only.

### Getting an Anthropic API key

1. Sign up at https://platform.claude.com
2. Add billing under Settings → Billing (new accounts get a small free
   credit to start testing with)
3. Create a key at https://platform.claude.com/settings/keys

## What's implemented

- **Staged plan uploads** — a separate upload slot per construction stage
  (footing, plinth, column, beam & slab, brickwork, roofing, plastering,
  flooring...). PDF only — see the DWG note below.
- **Missing-field prompts** — after analysis, any field the extraction
  couldn't find becomes a form asking you to fill it in, instead of
  guessing.
- **Material + cost estimation with real IS-code citations** — pulled from
  the actual IS-code PDFs in this project (IS 1904:1986 foundations, IS
  383:1970 aggregates, IS 2212:1991 brickwork, IS 875-1/2:1987 loads). See
  `lib/ai/isCodeClauses.json` for the exact extracted clauses and
  `lib/estimator.js` for where each one is cited. Thumb-rule figures that
  aren't a direct IS clause quotation (cement bags/m³, steel % of concrete)
  are explicitly labelled as thumb-rules, not attributed to a code they
  don't come from.
- **A validation/sanity-check layer** (`lib/validation.js`) that recomputes
  every subtotal independently and flags out-of-range steel percentages or
  missing rates — this is the fix for the 10x arithmetic bug found in the
  reference app review.
- **Editable, per-district material rate table** — seeded with placeholder
  rates on project creation (`lib/rateDefaults.js`), editable from the
  Rates tab. Update these to real local prices before trusting a cost
  total.
- **Mandatory EXIF-verified site photos** — a photo upload is rejected
  outright if it has no capture timestamp or GPS location in its EXIF data
  (`lib/exifCheck.js`). No override.
- **AI progress remarks** — rule-based in mock mode (schedule position +
  documentation completeness), swappable for a real model call.
- **Planned vs. actual schedule dashboard**, with a delay-reason field per
  entry.
- **Monthly calendar** — click a day to see everything logged that day;
  multiple entries per day are supported.
- **Curing / essential-task checklists** — auto-created for stages that
  involve fresh concrete or mortar (footing, plinth, column, beam & slab,
  brickwork), grounded in IS 2212:1991 cl. 11.10 (7-day wet curing).
- **English / Hindi / Kannada** language switcher (`lib/i18n/`).
- A clean, minimal visual style in the spirit of Claude's own app —
  generous whitespace, warm clay/cream palette — built independently in
  Tailwind, with its own name and branding (not Anthropic's).

## Known limitation: DWG files

True `.dwg` is a proprietary binary CAD format with no reliable open-source
parser. Per the scoping decision made for this version, **PDF is the only
format actually analyzed** — export or print your drawing to PDF before
uploading. A `.dwg` can still be attached for record-keeping but won't be
read. If a future version needs real DWG support, the practical paths are:
(a) ask uploaders for DXF instead (an open, text-based CAD format many
tools can export to — real geometry parsing becomes possible via a library
like `dxf-parser`), or (b) run the DWG through a conversion service before
upload.

## Extending the estimator

`lib/estimator.js` currently prices footing, plinth, column, beam/slab and
brickwork stages in detail; roofing/plastering/flooring log an area-based
placeholder line. Add a stage's material formula there, plus its expected
fields in `lib/ai/stageSchema.js`.
