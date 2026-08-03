export class ClinicalDecisionOutputMapper {
  map({
    request,
    orchestration,
  } = {}) {
    const ranking =
      orchestration?.finalRanking || null;
    const synthesis =
      orchestration?.synthesis || null;

    return Object.freeze({
      requestId: request.requestId,
      executionId:
        orchestration?.executionId || null,
      riskCategory:
        synthesis?.riskCategory ||
        ranking?.synthesis?.leadingHypothesis
          ?.status ||
        "UNSPECIFIED",
      morphologicRiskClass:
        synthesis?.morphologicRiskClass ||
        "UNSPECIFIED",
      interpretiveSynthesis:
        synthesis?.interpretiveSynthesis ||
        synthesis?.summary ||
        null,
      clinicalMeaning:
        synthesis?.clinicalMeaning || null,
      educationalImpact:
        synthesis?.educationalImpact || null,
      hematologicReasoning:
        synthesis?.hematologicReasoning || null,
      patternRecognition:
        synthesis?.patternRecognition || null,
      structuredReport:
        synthesis?.structuredReport || null,
      alerts: Object.freeze([
        ...(Array.isArray(synthesis?.alerts)
          ? synthesis.alerts
          : []),
      ]),
      rankedHypotheses:
        ranking?.rankedHypotheses ||
        Object.freeze([]),
      requiresHumanReview:
        orchestration?.requiresHumanReview === true,
      safetyStatement:
        "Interpret with clinical, laboratory and specialist correlation.",
    });
  }
}
