import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
  evaluateMarrowDominantPatternState,
  applyMarrowDominantPatternStateReconciliation,
} from "../ai/boneMarrow/marrowDominantPatternStateReconciliationEngine.js";

function lmcLike() {
  return {
    marrowMyeloidExpansionDiscrimination: { pathologicMyeloidExpansionSupported:true, structuredPathologicSubset:false, blastArchitecture:{structuredPathologicSubset:false} },
    marrowPathologicMaturationContinuumLock: {active:true, classification:"PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION"},
    marrowPrecursorDiscrimination:{classification:"UNRESOLVED_BLASTOID_CYTOLOGY", coherentBlastoidSubpopulation:false},
    marrowMaturationContinuumDiscrimination:{classification:"INDETERMINATE_MATURATION_VS_BLASTOID"},
    marrowPositiveCytologyConsistency:{state:"UNRESOLVED_BLASTOID_CYTOLOGY", unresolvedPositiveCytology:true},
    myeloidSeries:{maturationSpectrum:"broad granulocytic maturation", expansionContext:{numerousGranulocyticPrecursors:true,leftShiftedMaturationSpectrum:true}},
    blastAssessment:{immatureCellBurden:"multiple"},
    findings:{immatureCells:false,blastSuspicion:false},
    globalPattern:{dominantPattern:"GLOBAL_UNREMARKABLE_PATTERN",normalityBlocked:true},
    fieldAdequacy:{visibleLeukocytes:0,limitedField:true}, visibleLeukocytes:0,
    confidenceAnalysis:{globalConfidenceScore:0},
  };
}

test("PASS 0 — 005.42 identity is registered",()=>assert.equal(MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,"BE-FIX-005.42"));
test("PASS 1 — protected expansion without blast architecture permits reconciliation",()=>assert.equal(evaluateMarrowDominantPatternState(lmcLike()).reconciliationAllowed,true));
test("PASS 2 — residual precursor and maturation indeterminate states are superseded",()=>{const o=applyMarrowDominantPatternStateReconciliation(lmcLike());assert.equal(o.marrowPrecursorDiscrimination.classification,"PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION");assert.equal(o.marrowMaturationContinuumDiscrimination.classification,"PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION");});
test("PASS 3 — cytology is contextualized rather than converted to blast-negative evidence",()=>{const o=applyMarrowDominantPatternStateReconciliation(lmcLike());assert.equal(o.marrowPositiveCytologyConsistency.unresolvedPositiveCytology,false);assert.equal(o.marrowDominantPatternStateReconciliation.globalBlastExclusionAllowed,false);});
test("PASS 4 — myeloid precursor immaturity is separated from legacy blast-oriented immatureCells",()=>{const o=applyMarrowDominantPatternStateReconciliation(lmcLike());assert.equal(o.findings.myeloidPrecursorsObserved,true);assert.equal(o.findings.immatureCells,false);});
test("PASS 5 — global unremarkable pattern is replaced by the protected marrow dominant pattern",()=>{const o=applyMarrowDominantPatternStateReconciliation(lmcLike());assert.equal(o.globalPattern.dominantPattern,"MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN");assert.equal(o.globalPattern.normalityBlocked,true);});
test("PASS 6 — legacy zero visible leukocytes is converted to unknown, never fabricated",()=>{const o=applyMarrowDominantPatternStateReconciliation(lmcLike());assert.equal(o.visibleLeukocytes,null);assert.equal(o.visibleLeukocyteCountSemantics.value,null);});
test("PASS 7 — zero confidence is replaced by conservative morphology-pattern confidence",()=>{const o=applyMarrowDominantPatternStateReconciliation(lmcLike());assert.equal(o.confidenceAnalysis.globalConfidenceScore,40);assert.equal(o.confidenceAnalysis.patternConfidenceScope,"MORPHOLOGIC_PATTERN_ONLY");});
test("PASS 8 — true structured blastoid population blocks 005.42 reconciliation",()=>{const x=lmcLike();x.marrowMyeloidExpansionDiscrimination.structuredPathologicSubset=true;const o=applyMarrowDominantPatternStateReconciliation(x);assert.equal(o.marrowDominantPatternStateReconciliation.reconciliationAllowed,false);assert.equal(o.globalPattern.dominantPattern,"GLOBAL_UNREMARKABLE_PATTERN");});
test("PASS 9 — server exposes runtime fingerprints and applies 005.42 after 005.38 before CRA",()=>{const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");assert.match(s,/marrowDominantPatternStateReconciliationVersion/);assert.match(s,/marrowPrecursorBlastSemanticSeparationVersion/);assert.match(s,/marrowGlobalPatternReconciliationVersion/);const a=s.lastIndexOf("applyMarrowMyeloidExpansionDiscrimination(finalResult)");const b=s.lastIndexOf("applyMarrowDominantPatternStateReconciliation(finalResult)");const c=s.indexOf("CRA-001.1 — CANONICAL CLINICAL TRUTH FOUNDATION",b);assert.ok(a<b&&b<c);});
