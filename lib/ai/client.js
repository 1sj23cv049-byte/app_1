// Single entry point for every AI-powered feature in the app: drawing
// analysis, missing-field follow-up, and site-photo progress remarks.
//
// Today (USE_MOCK_AI=true, the default until you have an API key) every
// function below is served by lib/ai/mockAI.js — real PDF text extraction
// plus rule-based heuristics, no external calls, so the whole app works
// end-to-end for a demo with zero setup.
//
// When you're ready to wire in real Claude vision analysis: set
// USE_MOCK_AI=false and ANTHROPIC_API_KEY in .env.local, then implement the
// three functions in the `else` branch below using @anthropic-ai/sdk. The
// call sites elsewhere in the app (app/api/**) never change — they only
// import from this file.

import * as mock from './mockAI';

const USE_MOCK = (process.env.USE_MOCK_AI ?? 'true') !== 'false';

export async function analyzeDrawing({ stageKey, pdfBuffer }) {
  if (USE_MOCK) return mock.analyzeDrawing({ stageKey, pdfBuffer });

  // --- Real implementation sketch (uncomment and adapt once you have a key) ---
  //
  // import Anthropic from '@anthropic-ai/sdk';
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const msg = await anthropic.messages.create({
  //   model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
  //   max_tokens: 2000,
  //   messages: [{
  //     role: 'user',
  //     content: [
  //       { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBuffer.toString('base64') } },
  //       { type: 'text', text: `Extract ONLY structured parameters for the "${stageKey}" construction
  //         stage as JSON matching this schema: ${JSON.stringify(requiredFieldsFor(stageKey))}.
  //         Do NOT perform any arithmetic — return raw extracted numbers only. If a field is not
  //         visible in the drawing, omit it (do not guess).` }
  //     ]
  //   }]
  // });
  // -> parse msg.content into { extracted, missingFields } the same shape mockAI returns.
  //
  throw new Error('Real AI client not yet implemented — set USE_MOCK_AI=true or implement lib/ai/client.js');
}

export async function generateProgressRemark(args) {
  if (USE_MOCK) return mock.generateProgressRemark(args);
  throw new Error('Real AI client not yet implemented — set USE_MOCK_AI=true or implement lib/ai/client.js');
}
