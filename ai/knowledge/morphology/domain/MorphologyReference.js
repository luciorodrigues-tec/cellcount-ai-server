export function createMorphologyReference({
  id,
  title,
  organization = "",
  edition = "",
  year = null,
  locator = "",
  note = "",
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError("MorphologyReference.id is required.");
  }

  if (!title || !String(title).trim()) {
    throw new TypeError("MorphologyReference.title is required.");
  }

  const numericYear =
    year === null || year === undefined
      ? null
      : Number(year);

  if (
    numericYear !== null &&
    (
      !Number.isInteger(numericYear) ||
      numericYear < 1800 ||
      numericYear > 2200
    )
  ) {
    throw new TypeError(
      "MorphologyReference.year must be a valid year.",
    );
  }

  return Object.freeze({
    id: String(id).trim(),
    title: String(title).trim(),
    organization: String(organization || "").trim(),
    edition: String(edition || "").trim(),
    year: numericYear,
    locator: String(locator || "").trim(),
    note: String(note || "").trim(),
  });
}
