function validateConsistency(result = {}) {
  result.findings = result.findings || {};
  result.overallAssessment = result.overallAssessment || {};
  result.criticalFlags = Array.isArray(result.criticalFlags)
    ? result.criticalFlags
    : [];

  const f = result.findings;

  const hasAtypia =
    Boolean(f.largeMononuclearCells) ||
    Boolean(f.plasmacytoidCells) ||
    Boolean(f.plasmocytes) ||
    Boolean(f.plasmablasts) ||
    Boolean(f.atypicalLymphocytes) ||
    Boolean(f.monomorphicPopulation) ||
    Boolean(f.immatureCells) ||
    Boolean(f.blastSuspicion);

  if (hasAtypia) {
    result.normalityBlocked = true;

    result.blockNormalReason = Array.isArray(result.blockNormalReason)
      ? result.blockNormalReason
      : [];

    if (f.largeMononuclearCells) {
      result.blockNormalReason.push("Células mononucleares grandes");
    }

    if (f.plasmacytoidCells) {
      result.blockNormalReason.push("Células plasmocitoides");
    }

    if (f.plasmocytes) {
      result.blockNormalReason.push("Plasmócitos visíveis");
    }

    if (f.plasmablasts) {
      result.blockNormalReason.push("Plasmoblastos suspeitos");
    }

    if (f.atypicalLymphocytes) {
      result.blockNormalReason.push("Linfócitos atípicos");
    }

    if (f.monomorphicPopulation) {
      result.blockNormalReason.push("População monomórfica");
    }

    if (f.immatureCells) {
      result.blockNormalReason.push("Células imaturas");
    }

    if (f.blastSuspicion) {
      result.blockNormalReason.push("Suspeita blástica");
    }

    if (f.monomorphicPopulation) {
      result.normalityBlocked = true;

      result.overallAssessment.requiresHumanReview = true;

      result.blockNormalReason.push(
        "Monomorfismo celular"
      );
    }

    result.blockNormalReason = [...new Set(result.blockNormalReason)];

    result.overallAssessment.requiresHumanReview = true;

    if (
      !result.morphologicRiskClass ||
      result.morphologicRiskClass === "CLASS_0_NORMAL"
    ) {
      result.morphologicRiskClass = "CLASS_2_ATYPICAL_POPULATION";
    }

    result.overallAssessment.safetyMessage =
      "Há achados morfológicos que impedem classificação como normalidade morfológica. Recomenda-se revisão por profissional habilitado.";

   if (
     (
       f.plasmablasts ||
       f.plasmacytoidCells
     ) &&
     f.monomorphicPopulation
   ) {

     result.morphologicRiskClass =
       "CLASS_5_HIGH_NEOPLASTIC_SUSPICION";

     result.riskLevel =
       "RISCO MORFOLÓGICO ALTO";

     result.overallAssessment.requiresHumanReview =
       true;

     result.normalityBlocked =
       true;

     result.blockNormalReason.push(
       "População plasmocitoide/plasmoblástica monomórfica"
     );

     result.overallAssessment.safetyMessage =
       "População plasmocitoide/plasmoblástica monomórfica impede classificação como baixo risco. Recomenda-se revisão microscópica profissional e correlação hematológica especializada.";
   }

  if (
    f.largeMononuclearCells &&
    f.monomorphicPopulation &&
    !f.reactiveLymphocytes &&
    !f.atypicalLymphocytes &&
    !f.plasmocytes &&
    !f.plasmacytoidCells
  ) {

    result.morphologicRiskClass =
      "CLASS_3_ATYPICAL_MONOMORPHIC_POPULATION";

    result.riskLevel =
      "RISCO MORFOLÓGICO MODERADO";

    result.overallAssessment.requiresHumanReview =
      true;

    result.normalityBlocked =
      true;
  }

    result.riskLevel =
      "RISCO MORFOLÓGICO MODERADO/ALTO";

    result.overallAssessment.requiresHumanReview =
      true;

    result.normalityBlocked =
      true;

    result.blockNormalReason.push(
      "População monomórfica de células grandes"
    );

    result.overallAssessment.safetyMessage =
      "População monomórfica de células grandes impede classificação como baixo risco. Recomenda-se revisão microscópica profissional.";
  }

   if (
     result.morphologicRiskClass ===
       "CLASS_4_BLAST_SUSPICION" ||

     result.morphologicRiskClass ===
       "CLASS_5_HIGH_NEOPLASTIC_SUSPICION"
   ) {
     result.overallAssessment.requiresHumanReview =
       true;

     result.normalityBlocked =
       true;
   }

   } // FECHA if (hasAtypia)

   return result;
   }

   export default validateConsistency;