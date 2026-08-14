import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CLINICAL_FINDING_FIRST_NARRATIVE_GOVERNANCE_VERSION,
  buildClinicalResultCoherenceProjection,
} from "../ai/clinicalResultV2/clinicalResultCoherenceEngine.js";
import { buildExpertHematologyNarrative } from "../ai/clinicalResultV2/expertHematologyNarrative.js";
import { ClinicalEvidenceState } from "../ai/clinicalResultV2/clinicalEvidenceState.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const flutter = fs.readFileSync(
  path.resolve(root, "..", "frontend", "cellcount_clin", "lib", "features", "calculator", "screens", "ai_result_screen.dart"),
  "utf8",
);

function suspiciousLimitedTruth() {
  return {
    criticalFindings: {
      blastLike: { state: ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE },
      auerRods: { state: ClinicalEvidenceState.NOT_ASSESSABLE },
      schistocytes: { state: ClinicalEvidenceState.NOT_ASSESSABLE },
      parasites: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD },
    },
    parasiteArtifact: { parasite: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD } },
    patternInterpretation: {},
    morphologySignals: {},
    scope: { limitedField: true, populationInferenceAllowed: false },
    review: { required: true, urgency: "PRIORITY" },
    risk: { severity: "HIGH" },
    lineages: {},
  };
}

test("PASS 0 — 005.19 finding-first governance is registered", () => {
  assert.equal(CLINICAL_FINDING_FIRST_NARRATIVE_GOVERNANCE_VERSION, "BE-FIX-005.19");
});

test("PASS 1 — suspicious blast limited-field synopsis starts with the finding, not field limitation", () => {
  const out = buildClinicalResultCoherenceProjection(suspiciousLimitedTruth(), {});
  assert.match(out.executiveConclusion, /^SUSPEITA BLÁSTICA\/BLASTOIDE:/);
  assert.doesNotMatch(out.executiveConclusion, /^(Campo|Embora|Representatividade)/i);
});

test("PASS 2 — suspicious blast remains HIGH and PRIORITY, never promoted to confirmed critical", () => {
  const out = buildClinicalResultCoherenceProjection(suspiciousLimitedTruth(), {});
  assert.equal(out.riskTier.level, "HIGH");
  assert.equal(out.reviewStatus.urgency, "PRIORITY");
  assert.equal(out.presentationGovernance.clinicalPriority, "BLAST_SUSPICION_PRIORITY");
});

test("PASS 3 — limited field is retained after the finding and does not erase suspicion", () => {
  const out = buildClinicalResultCoherenceProjection(suspiciousLimitedTruth(), {});
  assert.match(out.executiveConclusion, /representatividade limitada/i);
  assert.match(out.executiveConclusion, /não invalida a suspeita observada/i);
});

test("PASS 4 — expert narrative follows the same finding-first hierarchy", () => {
  const out = buildExpertHematologyNarrative(suspiciousLimitedTruth(), {});
  assert.match(out.executiveSynthesis, /^SUSPEITA BLÁSTICA\/BLASTOIDE:/);
  assert.doesNotMatch(out.executiveSynthesis, /^(Campo|Embora|Representatividade)/i);
});

test("PASS 5 — Flutter hero gives blast priority before limited-field fallback", () => {
  const blastPriority = flutter.indexOf("criticalBlastConfirmed || blastSuspicionPriority");
  const limitedFallback = flutter.indexOf("_isLimitedField(analysis)", blastPriority);
  assert.ok(blastPriority >= 0 && limitedFallback > blastPriority);
});

test("PASS 6 — optional morphology cards use one normalized 18px section gap instead of accumulating hidden spacers", () => {
  assert.match(flutter, /Widget _reportSectionGap\(Widget child\)/);
  assert.match(flutter, /EdgeInsets\.only\(bottom: 18\)/);
  const start = flutter.indexOf("visualNarrative.trim().isNotEmpty");
  const end = flutter.indexOf("title: 'Confiabilidade da Avaliação Visual'", start);
  const block = flutter.slice(start, end);
  assert.doesNotMatch(block, /const SizedBox\(height: 18\)/);
  assert.ok((block.match(/_reportSectionGap\(_textSection\(/g) || []).length >= 5);
});
