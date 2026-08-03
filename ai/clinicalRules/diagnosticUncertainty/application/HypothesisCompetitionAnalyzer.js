export const HYPOTHESIS_COMPETITION_ANALYZER_VERSION =
  "CRR-000031-v1.0.0";

export class HypothesisCompetitionAnalyzer {
  analyze(hypotheses = []) {
    const ranked = [
      ...(Array.isArray(hypotheses)
        ? hypotheses
        : []),
    ]
      .map((item) => ({
        ...item,
        score:
          Number(
            item.score ??
            item.compositeScore ??
            item.consensusScore ??
            0,
          ),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.score),
      )
      .sort(
        (a, b) =>
          b.score - a.score,
      );

    if (ranked.length < 2) {
      return Object.freeze({
        uncertaintyScore: 0,
        topGap: 1,
        competingCount: ranked.length,
        topHypotheses:
          Object.freeze(ranked),
      });
    }

    const top = ranked[0].score;
    const second = ranked[1].score;
    const topGap = Math.max(
      0,
      Math.min(
        1,
        top - second,
      ),
    );

    return Object.freeze({
      uncertaintyScore:
        Number(
          (1 - topGap).toFixed(8),
        ),
      topGap:
        Number(topGap.toFixed(8)),
      competingCount:
        ranked.length,
      topHypotheses:
        Object.freeze(
          ranked.slice(0, 3),
        ),
    });
  }
}
