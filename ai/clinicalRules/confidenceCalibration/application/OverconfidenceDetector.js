export class OverconfidenceDetector {
  detect({
    declaredConfidence,
    calibratedConfidence,
    threshold,
  } = {}) {
    if (
      declaredConfidence === null ||
      declaredConfidence === undefined
    ) {
      return false;
    }

    return (
      Number(declaredConfidence) -
        Number(calibratedConfidence) >=
      Number(threshold)
    );
  }
}
