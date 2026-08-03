export function createDifferentialPair({
  id,
  primaryCell,
  alternativeCell,
  primaryRank = 1,
  alternativeRank = null,
  primaryScore = 0,
  alternativeScore = 0,
  primaryNormalizedScore = 0,
  alternativeNormalizedScore = 0,
  marginFromWinner = 0,
  specimenType = null,
  ruleId = null,
  rule = null,
  registeredRule = false,
  reverseOrientation = false,
  eligible = false,
  rejectionReasons = [],
  source = "RANKING",
  metadata = {},
} = {}) {
  if (!primaryCell) {
    throw new TypeError(
      "DifferentialPair.primaryCell is required.",
    );
  }

  if (!alternativeCell) {
    throw new TypeError(
      "DifferentialPair.alternativeCell is required.",
    );
  }

  if (
    String(primaryCell) ===
    String(alternativeCell)
  ) {
    throw new TypeError(
      "Differential pair cells must be different.",
    );
  }

  return Object.freeze({
    id:
      id ||
      `PAIR-${primaryCell}-${alternativeCell}`,
    primaryCell:
      String(primaryCell),
    alternativeCell:
      String(alternativeCell),
    primaryRank:
      Number(primaryRank || 1),
    alternativeRank:
      alternativeRank == null
        ? null
        : Number(alternativeRank),
    primaryScore:
      Number(primaryScore || 0),
    alternativeScore:
      Number(alternativeScore || 0),
    primaryNormalizedScore:
      Number(
        primaryNormalizedScore || 0,
      ),
    alternativeNormalizedScore:
      Number(
        alternativeNormalizedScore || 0,
      ),
    marginFromWinner:
      Number(
        marginFromWinner || 0,
      ),
    specimenType:
      specimenType || null,
    ruleId:
      ruleId || null,
    rule:
      rule || null,
    registeredRule:
      registeredRule === true,
    reverseOrientation:
      reverseOrientation === true,
    eligible:
      eligible === true,
    rejectionReasons:
      Object.freeze([
        ...new Set(
          rejectionReasons || [],
        ),
      ]),
    source:
      String(source || "RANKING"),
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
