CELLCOUNT — CI-002D.5
EXCLUSIVE FEATURE ENGINE V1

Built on CI-002D.4 Differential Evidence Engine.

New module:
ai/differentialDiagnosis/exclusiveFeatureEngine/

Metrics:
- specificity
- sensitivity
- evidence weight
- observed confidence
- cross-lineage penalty
- final discrimination score

Classes:
PATHOGNOMONIC
VERY_HIGH
HIGH
MODERATE
LOW
NON_DISCRIMINATIVE

Endpoint:
POST /knowledge/morphology/analyze-exclusive-features

Expected log:
EXCLUSIVE FEATURE ENGINE: 12 discriminative rules

Next:
CI-002D.6 — Diagnostic Conflict Engine
