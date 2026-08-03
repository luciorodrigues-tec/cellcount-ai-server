# CI-001B Changelog

## Clinical routing

The previous server selected the marrow prompt from `analysisType`, whose
route default was `peripheral_blood`. The new gate derives routing from the
validated `specimenDecision.effectiveType`.

## Safety

Visual and hybrid requests are rejected with HTTP 422 when the specimen
decision is missing, blocked, inadequate or indeterminate.

## Bone marrow

The marrow contract now requires adequacy, spicules, hemodilution, lineage
reviews, plasma cells, blasts, dysplasia, infiltration and limitations.
Peripheral-blood global phrases are sanitized from marrow reports.
