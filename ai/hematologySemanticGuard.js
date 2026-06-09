export function sanitizeHematologyLanguage(result) {

  const findings =
    result.findings || {};

  const blast =
    findings.blastSuspicion === true;

  const monomorphic =
    findings.monomorphicPopulation === true;

  const plasmablasts =
    findings.plasmablasts === true;

  const reactive =
    findings.reactiveLymphocytes === true ||
    findings.atypicalLymphocytes === true;

  // =====================================================
  // NÃO HÁ EVIDÊNCIA FORTE
  // =====================================================

  if (
    !blast &&
    !monomorphic &&
    !plasmablasts
  ) {

    replaceEverywhere(
      result,
      [
        "população atípica",
        "população celular atípica",
        "proliferação atípica",
        "processo neoplásico",
        "suspeita neoplásica",
        "linfoproliferativo",
        "plasmoblástico",
        "plasmoblastose",
      ],
      "possível reatividade celular isolada",
    );
  }

  // =====================================================
  // REATIVO
  // =====================================================

  if (reactive) {

    replaceEverywhere(
      result,
      [
        "atipia",
      ],
      "reatividade",
    );
  }

  return result;
}

function replaceEverywhere(
  obj,
  searchTerms,
  replacement,
) {

  if (!obj) return;

  Object.keys(obj).forEach(key => {

    const value = obj[key];

    if (
      typeof value === "string"
    ) {

      let text = value;

      for (
        const term of searchTerms
      ) {

        text =
          text.replace(
            new RegExp(
              term,
              "gi",
            ),
            replacement,
          );
      }

      obj[key] = text;
    }

    else if (
      typeof value === "object"
    ) {

      replaceEverywhere(
        value,
        searchTerms,
        replacement,
      );
    }
  });
}
