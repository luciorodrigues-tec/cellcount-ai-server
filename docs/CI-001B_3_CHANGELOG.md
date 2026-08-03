# CI-001B.3 — Bone Marrow Output Contract Enforcement

## Contract

The following fields are now always present for marrow analyses:

- specimenAssessment
- marrowAdequacy
- spiculeAssessment
- hemodilutionAssessment
- cellularityAssessment
- myeloidSeries
- erythroidSeries
- megakaryocyticSeries
- plasmaCellAssessment
- blastAssessment
- dysplasiaAssessment
- infiltrationAssessment
- marrowLimitations

## Safety semantics

The contract distinguishes:

- `present`
- `notObserved`
- `notAssessable`
- `indeterminate`

`notAssessable` is never converted into a false absence claim.

## Integration

The contract is enforced after specimen metadata, after the existing marrow
language guard, and once more after pipeline-object normalization. This protects
the marrow schema from later blood-oriented normalizers.
