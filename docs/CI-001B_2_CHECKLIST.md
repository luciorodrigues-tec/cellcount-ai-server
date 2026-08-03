# CI-001B.2 Clinical Validation Checklist

## Case A — Peripheral blood

- [ ] `/classify-specimen` returned JSON.
- [ ] `predictedType` was recorded.
- [ ] `/analyze-slide` accepted `specimenDecision`.
- [ ] Final routing was `peripheral_blood`.
- [ ] Final response preserved specimen metadata.
- [ ] No marrow-only conclusion was generated.

## Case B — Bone marrow

- [ ] `/classify-specimen` returned JSON.
- [ ] A marrow classification was recorded.
- [ ] `/analyze-slide` accepted `specimenDecision`.
- [ ] Final routing was `bone_marrow`.
- [ ] Final response preserved specimen metadata.
- [ ] No peripheral-blood normal conclusion was generated.
- [ ] Adequacy and representativity were addressed.
- [ ] Cellularity was not overgeneralized from a limited field.
- [ ] Myeloid, erythroid and megakaryocytic series were addressed.
- [ ] Plasma cells, blasts, dysplasia and infiltration were addressed.
- [ ] Limitations and human review were stated when needed.
