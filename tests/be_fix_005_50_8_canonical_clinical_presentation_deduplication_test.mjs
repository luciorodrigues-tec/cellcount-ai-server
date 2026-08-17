import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCanonicalClinicalPresentation,
  applyCanonicalClinicalPresentationAuthority,
  CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
} from '../ai/clinicalResultV2/canonicalClinicalPresentationAuthority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const server = fs.readFileSync(path.join(here, '..', 'server.js'), 'utf8');

const golden = () => ({
  clinicalCriticality: { level: 'CRITICAL', score: 92 },
  requiresHumanReview: true,
  fieldAdequacy: { limitedField: true },
  clinicalResultV2: {
    scope: { limitedField: true },
    risk: { severity: 'CRITICAL' },
    review: { required: true },
    criticalFindings: { blastLike: { state: 'SUSPICIOUS_INDETERMINATE', evidence: ['Célula focal com cromatina aberta e nucléolo.'] } },
    lineages: { erythrocytes: { positiveMorphology: { polychromasia: true } } },
    presentation: { clinicalCriticality: { level: 'CRITICAL' } },
    provenance: { craVersion: 'CRA-001.1' },
  },
  interpretiveSynthesis: 'A morfologia focal sustenta suspeição de imaturidade/blastoidia.',
  structuredReport: { recommendation: 'Revisão microscópica de múltiplos campos e correlação com hemograma e dados clínicos.' },
});

test('PASS 0 — 005.50.8 identity and server wiring are registered', () => {
  assert.equal(CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION, 'BE-FIX-005.50.8');
  assert.match(server, /applyCanonicalClinicalPresentationAuthority/);
  assert.match(server, /canonicalClinicalPresentationAuthorityVersion/);
});

test('PASS 1 — one canonical headline owns the executive presentation', () => {
  const p = buildCanonicalClinicalPresentation(golden());
  assert.equal(p.headline.title, 'Suspeita blástica / blastoide');
  assert.equal(p.presentationPolicy.singleHeadline, true);
});

test('PASS 2 — positive blastoid morphology and polychromasia coexist', () => {
  const p = buildCanonicalClinicalPresentation(golden());
  assert.deepEqual(p.positiveFindings.map((x) => x.key), ['focal_blastoid_immaturity', 'polychromasia']);
});

test('PASS 3 — polychromasia never inherits global CRITICAL severity', () => {
  const p = buildCanonicalClinicalPresentation(golden());
  const rbc = p.positiveFindings.find((x) => x.key === 'polychromasia');
  assert.equal(rbc.findingSeverity, 'MORPHOLOGIC_POSITIVE');
  assert.notEqual(rbc.findingSeverity, p.headline.criticality);
});

test('PASS 4 — limited-field warning is projected once', () => {
  const p = buildCanonicalClinicalPresentation(golden());
  assert.match(p.limitation, /representatividade limitada/i);
  assert.equal(p.presentationPolicy.singleLimitation, true);
});

test('PASS 5 — recommendation is projected once', () => {
  const p = buildCanonicalClinicalPresentation(golden());
  assert.match(p.recommendation, /múltiplos campos/i);
  assert.equal(p.presentationPolicy.singleRecommendation, true);
});

test('PASS 6 — authority is additive and preserves legacy clinical truth', () => {
  const input = golden();
  const before = JSON.stringify(input.clinicalResultV2.criticalFindings);
  const out = applyCanonicalClinicalPresentationAuthority(input);
  assert.equal(JSON.stringify(out.clinicalResultV2.criticalFindings), before);
  assert.equal(out.clinicalPresentation.contractVersion, 'BE-FIX-005.50.8');
});

test('PASS 7 — 005.50.8 does not fabricate blastoid morphology', () => {
  const p = buildCanonicalClinicalPresentation({ clinicalResultV2: { scope: {}, risk: {}, review: {}, criticalFindings: {}, lineages: {} } });
  assert.equal(p.positiveFindings.some((x) => x.key === 'focal_blastoid_immaturity'), false);
});
