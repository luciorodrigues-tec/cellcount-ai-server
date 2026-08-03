export class UnderconfidenceDetector {
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
      Number(calibratedConfidence) -
        Number(declaredConfidence) >=
      Number(threshold)
    );
  }
}
