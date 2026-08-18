import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyMarrowUnresolvedImmaturityFinalStateCoherence,
  evaluateMarrowUnresolvedImmaturityFinalStateCoherence,
  sanitizeClinicalInternalVersionTags,
  MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
  MARROW_UNRESOLVED_IMMATURITY_GLOBAL_PATTERN_LOCK_VERSION,
  MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
  CLINICAL_INTERNAL_VERSION_TAG_SANITIZATION_VERSION,
} from '../ai/boneMarrow/marrowUnresolvedImmaturityFinalStateCoherenceEngine.js';

function unresolvedBase() {
  return {
    specimenType:'BONE_MARROW_ASPIRATE',
    fieldAdequacy:{limitedField:true,adequateForPopulationAssessment:false,populationInferenceAllowed:false,globalNegativeExclusionAllowed:false},
    findings:{blastSuspicion:false,immatureCells:false,blastEvidenceState:'NOT_ASSESSABLE'},
    blastAssessment:{
      status:'assessableLimited', observed:null, estimatedPercentage:null,
      evidenceState:'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY',
      summary:'BE-FIX-005.50.16: há imaturidade celular visível, porém não resolvida.'
    },
    marrowImmatureCellCytologyRecovery:{
      unresolvedCandidate:true,
      cellLevelUnresolvedImmaturity:true,
      candidateState:'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY',
      finalEvidenceState:'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY',
    },
    marrowMaturationContinuumDiscrimination:{
      strongPhysiologicContinuum:false,
      unresolvedImmatureCandidateAfterAcquisition:true,
      classification:'INDETERMINATE_MATURATION_VS_BLASTOID',
    },
    marrowPositiveBlastEvidenceSemanticSupersession:{
      active:false,
      priorEvidenceState:'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY',
      effectivePopulationEvidenceState:'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY',
      structuredArchitecture:false,
      populationInferenceAllowed:true,
      populationPositiveAllowed:true,
      negativeBlastExclusionAllowed:false,
    },
    globalPattern:{
      dominantPattern:'GLOBAL_UNREMARKABLE_PATTERN',
      physiologicAppearance:false,
      normalityBlocked:true,
      blastAssessmentIndeterminate:true,
      globalSummary:'A avaliação global identifica alteração morfológica não plenamente fisiológica.'
    },
    morphologyAnalysis:{
      summary:'População heterogênea com continuum maturativo; sem subpopulação blastóide distinta sustentada.',
      leukocyteReview:'BE-FIX-005.50.16: preservar candidato focal indeterminado.',
    },
    whatAISees:{
      dominantFinding:'População heterogênea com continuum maturativo.',
      leukocytes:'BE-FIX-005.50.16: preservar candidato focal indeterminado.',
    },
    blastSuspicion:{status:'indeterminate',summary:'Não há evidência suficiente de população blastóide distinta.'},
    overallAssessment:{status:'reviewRequired',requiresHumanReview:true,mainImpression:'Campo limitado.'},
    structuredReport:{conclusion:'Campo limitado.',recommendation:'Revisão microscópica.'},
    executiveSummary:{mainFinding:'Campo limitado.',pattern:'Padrão morfológico não definido.'},
    patternRecognition:{overallPattern:'Campo limitado para conclusão populacional'},
    evidenceGovernance:{limitedField:true,populationInferenceAllowed:false,globalNegativeExclusionAllowed:false},
    clinicalPresentation:{
      contractVersion:'BE/FE-FIX-005.50.9',
      headline:{title:'Análise hematológica',subtitle:'Resultado morfológico disponível para revisão.',requiresHumanReview:true},
      positiveFindings:[],
      interpretation:'BE-FIX-005.50.16: há imaturidade celular visível em campo rico em precursores.',
      limitation:'Campo de representatividade limitada; achados não visualizados não podem ser excluídos globalmente. O achado blástico/blastoide descrito permanece focal e não autoriza inferência de frequência populacional.',
      recommendation:'Revisão microscópica.',
      presentationPolicy:{blastPercentageInferenceAllowed:true,focalBlastoidFindingDoesNotEstablishPopulation:false},
      provenance:{authorityVersion:'BE/FE-FIX-005.50.9'},
    },
    clinicalResultV2:{
      review:{required:true},
      scope:{limitedField:true},
      presentation:{canonical:{headline:{title:'Análise hematológica'}}},
      provenance:{craVersion:'CRA-001.1'},
    },
  };
}

test('PASS 0 — 005.50.17 fingerprints are registered',()=>{
  assert.equal(MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,'BE-FIX-005.50.17');
  assert.equal(MARROW_UNRESOLVED_IMMATURITY_GLOBAL_PATTERN_LOCK_VERSION,'BE-FIX-005.50.17');
  assert.equal(MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,'BE-FIX-005.50.17');
  assert.equal(CLINICAL_INTERNAL_VERSION_TAG_SANITIZATION_VERSION,'BE-FIX-005.50.17');
});

test('PASS 1 — unresolved 005.50.16 state remains active at terminal coherence',()=>{
  const e=evaluateMarrowUnresolvedImmaturityFinalStateCoherence(unresolvedBase());
  assert.equal(e.active,true);
  assert.equal(e.evidenceState,'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY');
  assert.equal(e.structuredPositiveBlastPopulation,false);
});

test('PASS 2 — unresolved immaturity cannot remain GLOBAL_UNREMARKABLE or physiologic',()=>{
  const out=applyMarrowUnresolvedImmaturityFinalStateCoherence(unresolvedBase());
  assert.equal(out.globalPattern.dominantPattern,'MARROW_UNRESOLVED_IMMATURE_CYTOLOGY_PATTERN');
  assert.equal(out.globalPattern.physiologicAppearance,false);
  assert.equal(out.globalPattern.normalityBlocked,true);
  assert.equal(out.marrowMaturationContinuumDiscrimination.classification,'INDETERMINATE_MATURATION_VS_BLASTOID');
  assert.equal(out.marrowMaturationContinuumDiscrimination.strongPhysiologicContinuum,false);
});

test('PASS 3 — unresolved immaturity is non-promotional and blocks blast percentage inference',()=>{
  const out=applyMarrowUnresolvedImmaturityFinalStateCoherence(unresolvedBase());
  assert.equal(out.findings.blastSuspicion,false);
  assert.equal(out.findings.blastEvidenceState,'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY');
  assert.equal(out.blastAssessment.observed,null);
  assert.equal(out.blastAssessment.estimatedPercentage,null);
  assert.equal(out.evidenceGovernance.blastPopulationInferenceAllowed,false);
  assert.equal(out.evidenceGovernance.blastPercentageInferenceAllowed,false);
  assert.equal(out.marrowPositiveBlastEvidenceSemanticSupersession.populationPositiveAllowed,false);
  assert.equal(out.marrowPositiveBlastEvidenceSemanticSupersession.populationInferenceAllowed,false);
});

test('PASS 4 — canonical presentation communicates indeterminate focal immaturity without a positive blast claim',()=>{
  const out=applyMarrowUnresolvedImmaturityFinalStateCoherence(unresolvedBase());
  assert.equal(out.clinicalPresentation.headline.title,'Imaturidade celular focal indeterminada');
  assert.equal(out.clinicalPresentation.presentationPolicy.blastPercentageInferenceAllowed,false);
  assert.equal(out.clinicalPresentation.presentationPolicy.populationPositiveAllowed,false);
  assert.equal(out.clinicalPresentation.unresolvedImmaturity.active,true);
  assert.equal(out.clinicalPresentation.positiveFindings.some((f)=>f?.key==='focal_blastoid_immaturity'),false);
});

test('PASS 5 — internal BE-FIX identifiers are removed from user-facing narrative but provenance remains',()=>{
  const out=applyMarrowUnresolvedImmaturityFinalStateCoherence(unresolvedBase());
  const visible=JSON.stringify({
    morphologyAnalysis:out.morphologyAnalysis,
    whatAISees:out.whatAISees,
    clinicalPresentation:out.clinicalPresentation,
    overallAssessment:out.overallAssessment,
    structuredReport:out.structuredReport,
  });
  assert.equal(/BE(?:\/FE)?-FIX-005\.50\.16/i.test(visible),false);
  assert.equal(out.clinicalPresentation.provenance.authorityVersion,'BE/FE-FIX-005.50.9');
  assert.equal(sanitizeClinicalInternalVersionTags('BE-FIX-005.50.16: texto clínico'),'texto clínico');
});

test('PASS 6 — true observed blast population is protected and not downgraded by 005.50.17',()=>{
  const input=unresolvedBase();
  input.marrowBlastPopulationEvidence={evidenceState:'OBSERVED_POPULATION',observedPopulation:true};
  input.finalMarrowAuthority={structuredBlast:{observed:true,suspicious:false,structured:true}};
  const out=applyMarrowUnresolvedImmaturityFinalStateCoherence(input);
  assert.equal(out.marrowUnresolvedImmaturityFinalStateCoherence.active,false);
  assert.equal(out.marrowBlastPopulationEvidence.observedPopulation,true);
  assert.notEqual(out.globalPattern.dominantPattern,'MARROW_UNRESOLVED_IMMATURE_CYTOLOGY_PATTERN');
});

test('PASS 7 — ordinary physiologic marrow without unresolved evidence is not destabilized',()=>{
  const input={
    specimenType:'BONE_MARROW_ASPIRATE',
    blastAssessment:{evidenceState:'NOT_OBSERVED_IN_EVALUABLE_FIELD',observed:false},
    marrowMaturationContinuumDiscrimination:{classification:'PHYSIOLOGIC_MATURATION_CONTINUUM',strongPhysiologicContinuum:true,unresolvedImmatureCandidateAfterAcquisition:false},
    globalPattern:{dominantPattern:'MARROW_PHYSIOLOGIC_MATURATION_PATTERN',physiologicAppearance:true},
    clinicalPresentation:{provenance:{authorityVersion:'BE/FE-FIX-005.50.9'}},
  };
  const out=applyMarrowUnresolvedImmaturityFinalStateCoherence(input);
  assert.equal(out.marrowUnresolvedImmaturityFinalStateCoherence.active,false);
  assert.equal(out.globalPattern.dominantPattern,'MARROW_PHYSIOLOGIC_MATURATION_PATTERN');
});

test('PASS 8 — server integrates 005.50.17 before CRA, after canonical presentation, and exposes runtime fingerprints',()=>{
  const server=fs.readFileSync(new URL('../server.js',import.meta.url),'utf8');
  assert.match(server,/marrowUnresolvedImmaturityFinalStateCoherenceEngine\.js/);
  assert.match(server,/marrowUnresolvedImmaturityFinalStateCoherenceVersion/);
  assert.match(server,/marrowUnresolvedImmaturityGlobalPatternLockVersion/);
  assert.match(server,/marrowUnresolvedImmaturityPresentationLockVersion/);
  assert.match(server,/clinicalInternalVersionTagSanitizationVersion/);
  const beforeCra=server.indexOf('BE-FIX-005.50.17 — UNRESOLVED IMMATURE-CELL FINAL-STATE COHERENCE');
  const cra=server.indexOf('CRA-001.1 — CANONICAL CLINICAL TRUTH FOUNDATION');
  const canonical=server.indexOf('applyCanonicalClinicalPresentationAuthority(\n    finalResult');
  const afterCanonical=server.indexOf('presentation is the last user-facing writer');
  assert.ok(beforeCra > 0 && cra > beforeCra);
  assert.ok(canonical > 0 && afterCanonical > canonical);
});
