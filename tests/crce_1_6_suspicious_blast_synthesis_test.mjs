import assert from 'node:assert/strict';
import { buildExpertHematologyNarrative } from '../ai/clinicalResultV2/expertHematologyNarrative.js';
import { buildClinicalResultCoherenceProjection, CLINICAL_RESULT_COHERENCE_ENGINE_VERSION } from '../ai/clinicalResultV2/clinicalResultCoherenceEngine.js';
import { ClinicalEvidenceState, ClinicalSeverity } from '../ai/clinicalResultV2/clinicalEvidenceState.js';

const suspiciousBlast = {
  state: ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE,
  confidence: 0.68,
  evidence: ['Célula mononuclear com características de imaturidade/blastoidia.'],
  requiresReview: true,
  severity: ClinicalSeverity.HIGH,
};

const truth = {
  criticalFindings: {
    blastLike: suspiciousBlast,
    auerRods: { state: ClinicalEvidenceState.INDETERMINATE },
    schistocytes: { state: ClinicalEvidenceState.INDETERMINATE },
    parasites: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD },
  },
  parasiteArtifact: { parasite: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD } },
  patternInterpretation: {},
  morphologySignals: { focalMononuclearAtypia: true },
  scope: { limitedField: true, populationInferenceAllowed: false, globalNegativeExclusionAllowed: false },
  risk: { severity: ClinicalSeverity.HIGH },
  review: { required: true, urgency: 'PRIORITY' },
  quality: { confidence: 0.68 },
  lineages: {},
};

const narrative = buildExpertHematologyNarrative(truth, {});
const projection = buildClinicalResultCoherenceProjection(truth, narrative);

assert.equal(CLINICAL_RESULT_COHERENCE_ENGINE_VERSION, 'CRCE-1.6');
assert.equal(projection.morphologyClass.code, 'SUSPICIOUS_BLAST_LIKE_FINDING');
assert.equal(projection.criticalFindings.blastLike, 'SUSPICIOUS_INDETERMINATE');
assert.equal(projection.riskTier.level, 'HIGH');
assert.equal(projection.reviewStatus.urgency, 'PRIORITY');
assert.match(projection.executiveConclusion, /imaturidade\/blastoidia/i);
assert.match(projection.executiveConclusion, /revisão hematológica prioritária/i);
assert.doesNotMatch(projection.executiveConclusion, /não suficientemente avaliável/i);
assert.match(projection.integratedInterpretation, /suspeit/i);
assert.match(narrative.executiveSynthesis, /imaturidade\/blastoidia/i);
assert.ok(projection.evidenceGroups.suspicious.includes('Blastos/blastoides'));

console.log('CRCE-1.6 suspicious blast synthesis: PASS');
