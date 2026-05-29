// ============================================================================
// CELLCOUNT ENTERPRISE
// YOLO FUSION ENGINE V1
// Spatial AI layer: YOLO boxes + GPT morphology + hospital confidence
// ============================================================================

export function buildYoloFusion({
  yoloDetections = [],
  analysis = {},
  blastMorphologyAnalysis = {},
  imageMetadata = {},
} = {}) {
  const normalizedDetections =
    normalizeDetections(yoloDetections);

  const validDetections =
    normalizedDetections.filter(isValidDetection);

  const grouped =
    groupByClass(validDetections);

  const spatialSummary =
    buildSpatialSummary(grouped);

  const heatmapRegions =
    buildHeatmapRegions(validDetections, imageMetadata);

  const yoloCounts =
    buildYoloCounts(grouped);

  const blastSpatialSignal =
    buildBlastSpatialSignal({
      detections: validDetections,
      blastMorphologyAnalysis,
      analysis,
    });

  const fusionConfidence =
    calculateFusionConfidence({
      blastSpatialSignal,
      blastMorphologyAnalysis,
      validDetections,
    });

  return {
    engine: "YOLO_FUSION_ENGINE_V1",
    available: validDetections.length > 0,
    totalDetections: validDetections.length,
    yoloCounts,
    spatialSummary,
    blastSpatialSignal,
    fusionConfidence,
    heatmapRegions,
    recommendations:
      buildRecommendations({
        blastSpatialSignal,
        fusionConfidence,
        validDetections,
      }),
  };
}

// ============================================================================
// NORMALIZATION
// ============================================================================

function normalizeDetections(detections = []) {
  if (!Array.isArray(detections)) {
    return [];
  }

  return detections.map((d, index) => {
    const box =
      d.box ||
      d.bbox ||
      d.xywh ||
      {};

    const x =
      Number(d.x ?? box.x ?? box.left ?? box[0] ?? 0);

    const y =
      Number(d.y ?? box.y ?? box.top ?? box[1] ?? 0);

    const width =
      Number(d.width ?? d.w ?? box.width ?? box.w ?? box[2] ?? 0);

    const height =
      Number(d.height ?? d.h ?? box.height ?? box.h ?? box[3] ?? 0);

    const label =
      normalizeClassName(
        d.class ||
        d.label ||
        d.name ||
        d.className ||
        "unknown",
      );

    const confidence =
      normalizePercent(
        d.confidence ??
        d.score ??
        d.probability ??
        d.conf ??
        0,
      );

    return {
      id: d.id || `det_${index + 1}`,
      class: label,
      rawClass:
        d.class ||
        d.label ||
        d.name ||
        d.className ||
        "unknown",
      confidence,
      x,
      y,
      width,
      height,
      area: width * height,
      center: {
        x: x + width / 2,
        y: y + height / 2,
      },
      source: d.source || "yolo",
    };
  });
}

function isValidDetection(detection = {}) {
  return (
    Number.isFinite(detection.x) &&
    Number.isFinite(detection.y) &&
    Number.isFinite(detection.width) &&
    Number.isFinite(detection.height) &&
    detection.width > 3 &&
    detection.height > 3 &&
    detection.confidence >= 10
  );
}

// ============================================================================
// CLASS NORMALIZATION
// ============================================================================

function normalizeClassName(value = "") {
  const text = normalizeText(value);

  const aliases = {
    blast: [
      "blast",
      "blasto",
      "blastos",
      "suspected_blast",
      "blast_suspect",
      "celula_imatura",
      "immature_cell",
    ],

    promyelocyte: [
      "promyelocyte",
      "promielocito",
      "promielocito",
    ],

    myelocyte: [
      "myelocyte",
      "mielocito",
    ],

    metamyelocyte: [
      "metamyelocyte",
      "metamielocito",
    ],

    band: [
      "band",
      "bastonete",
      "band_neutrophil",
    ],

    neutrophil: [
      "neutrophil",
      "neutrofilo",
      "segmentado",
      "segmented",
    ],

    lymphocyte: [
      "lymphocyte",
      "linfocito",
      "linfocito_reativo",
      "reactive_lymphocyte",
    ],

    monocyte: [
      "monocyte",
      "monocito",
    ],

    eosinophil: [
      "eosinophil",
      "eosinofilo",
    ],

    basophil: [
      "basophil",
      "basofilo",
    ],

    erythroblast: [
      "erythroblast",
      "eritroblasto",
      "nucleated_rbc",
    ],

    platelet: [
      "platelet",
      "plaqueta",
      "macroplatelet",
    ],

    schistocyte: [
      "schistocyte",
      "esquizocito",
      "fragmented_rbc",
    ],
  };

  for (const [canonical, terms] of Object.entries(aliases)) {
    if (terms.some((term) => text.includes(normalizeText(term)))) {
      return canonical;
    }
  }

  return text || "unknown";
}

// ============================================================================
// GROUPING
// ============================================================================

function groupByClass(detections = []) {
  const grouped = {};

  for (const detection of detections) {
    if (!grouped[detection.class]) {
      grouped[detection.class] = [];
    }

    grouped[detection.class].push(detection);
  }

  return grouped;
}

function buildYoloCounts(grouped = {}) {
  const counts = {};

  for (const [className, detections] of Object.entries(grouped)) {
    counts[className] = detections.length;
  }

  return counts;
}

// ============================================================================
// SPATIAL SUMMARY
// ============================================================================

function buildSpatialSummary(grouped = {}) {
  const summary = {};

  for (const [className, detections] of Object.entries(grouped)) {
    const avgConfidence =
      average(detections.map((d) => d.confidence));

    const avgArea =
      average(detections.map((d) => d.area));

    summary[className] = {
      count: detections.length,
      averageConfidence: normalize(avgConfidence),
      averageArea: normalize(avgArea),
      maxConfidence: normalize(
        Math.max(...detections.map((d) => d.confidence)),
      ),
    };
  }

  return summary;
}

// ============================================================================
// BLAST SPATIAL SIGNAL
// ============================================================================

function buildBlastSpatialSignal({
  detections = [],
  blastMorphologyAnalysis = {},
  analysis = {},
}) {
  const blastDetections =
    detections.filter((d) =>
      [
        "blast",
        "promyelocyte",
        "myelocyte",
        "metamyelocyte",
        "erythroblast",
      ].includes(d.class),
    );

  const highConfidenceBlasts =
    blastDetections.filter((d) => d.confidence >= 45);

  const morphologyConfidence =
    Number(blastMorphologyAnalysis?.confidence || 0);

  const morphologyPresent =
    blastMorphologyAnalysis?.present === true;

  const visualSuspected =
    analysis?.visualExtraction?.suspectedBlasts === "present" ||
    analysis?.visualExtraction?.blastosSuspeitos === "present" ||
    analysis?.leukocyteFindings?.suspectedBlasts === "present" ||
    analysis?.leukocyteFindings?.blastosSuspeitos === "present";

  let score = 0;

  if (blastDetections.length > 0) {
    score += Math.min(30, blastDetections.length * 10);
  }

  if (highConfidenceBlasts.length > 0) {
    score += Math.min(25, highConfidenceBlasts.length * 12);
  }

  if (morphologyPresent) {
    score += Math.min(30, morphologyConfidence * 0.35);
  }

  if (visualSuspected) {
    score += 15;
  }

  const present =
    blastDetections.length > 0 ||
    morphologyPresent ||
    visualSuspected;

  return {
    present,
    score: normalize(score),
    yoloBlastCount: blastDetections.length,
    highConfidenceBlastCount: highConfidenceBlasts.length,
    morphologyConfidence,
    morphologyPresent,
    visualSuspected,
    dominantEvidence:
      highConfidenceBlasts.length > 0
        ? "spatial_yolo"
        : morphologyPresent
          ? "morphology_ai"
          : visualSuspected
            ? "gpt_visual"
            : "none",
    risk:
      score >= 75
        ? "high"
        : score >= 45
          ? "moderate"
          : score >= 25
            ? "minimal"
            : "low",
  };
}

// ============================================================================
// FUSION CONFIDENCE
// ============================================================================

function calculateFusionConfidence({
  blastSpatialSignal,
  blastMorphologyAnalysis,
  validDetections,
}) {
  let score = 0;

  if (validDetections.length > 0) {
    score += 20;
  }

  score +=
    Number(blastSpatialSignal?.score || 0) * 0.55;

  score +=
    Number(blastMorphologyAnalysis?.confidence || 0) * 0.35;

  if (blastSpatialSignal?.dominantEvidence === "spatial_yolo") {
    score += 12;
  }

  if (
    blastSpatialSignal?.morphologyPresent &&
    blastSpatialSignal?.visualSuspected
  ) {
    score += 10;
  }

  return normalize(score);
}

// ============================================================================
// HEATMAP
// ============================================================================

function buildHeatmapRegions(detections = [], imageMetadata = {}) {
  return detections
    .filter((d) => d.confidence >= 25)
    .map((d) => ({
      x: normalizeCoordinate(d.x),
      y: normalizeCoordinate(d.y),
      width: normalizeCoordinate(d.width),
      height: normalizeCoordinate(d.height),
      confidence: normalize(d.confidence),
      label: d.class,
      class: d.class,
      source: "yolo_fusion",
      severity:
        ["blast", "schistocyte", "promyelocyte"].includes(d.class)
          ? "high"
          : "standard",
      imageWidth:
        imageMetadata.width ||
        imageMetadata.originalWidth ||
        null,
      imageHeight:
        imageMetadata.height ||
        imageMetadata.originalHeight ||
        null,
    }));
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

function buildRecommendations({
  blastSpatialSignal,
  fusionConfidence,
  validDetections,
}) {
  const recommendations = [];

  if (validDetections.length === 0) {
    recommendations.push(
      "YOLO ainda não forneceu detecções espaciais. Resultado baseado em GPT/morfologia.",
    );
  }

  if (blastSpatialSignal?.present) {
    recommendations.push(
      "Sinal espacial/morfológico para células imaturas: revisão microscópica recomendada.",
    );
  }

  if (fusionConfidence >= 70) {
    recommendations.push(
      "Alta convergência entre morfologia e evidência espacial.",
    );
  }

  if (fusionConfidence < 35) {
    recommendations.push(
      "Baixa convergência espacial; considerar nova captura ou modelo YOLO treinado.",
    );
  }

  return unique(recommendations);
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s_]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function normalize(value) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(value) || 0),
    ),
  );
}

function normalizePercent(value) {
  const n = Number(value || 0);

  if (n <= 1) {
    return normalize(n * 100);
  }

  return normalize(n);
}

function normalizeCoordinate(value) {
  const n = Number(value || 0);

  if (!Number.isFinite(n)) {
    return 0;
  }

  return Math.max(0, Math.round(n));
}

function average(values = []) {
  if (!values.length) return 0;

  return (
    values.reduce((sum, value) => sum + Number(value || 0), 0) /
    values.length
  );
}

function unique(arr = []) {
  return [...new Set(arr)];
}