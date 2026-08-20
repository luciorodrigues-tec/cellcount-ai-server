export const ANALYSIS_JOB_PAYLOAD_CODEC_VERSION = 'INF-SCALE-001.2B';
export const DEFAULT_ANALYSIS_JOB_MAX_PAYLOAD_BYTES = 32 * 1024 * 1024;

function text(value, fallback = '') {
  return value == null ? fallback : String(value);
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeFile(file = {}) {
  const buffer = Buffer.isBuffer(file.buffer)
    ? file.buffer
    : Buffer.from(file.buffer ?? []);
  return {
    fieldname: text(file.fieldname, 'image'),
    originalname: text(file.originalname, 'image'),
    encoding: text(file.encoding, '7bit'),
    mimetype: text(file.mimetype, 'application/octet-stream'),
    size: Number.isFinite(Number(file.size)) ? Number(file.size) : buffer.length,
    dataBase64: buffer.toString('base64'),
  };
}

export function encodeAnalysisJobPayload({
  images = [],
  analysisSource,
  manualCounts = {},
  analysisType,
  specimenType,
  specimenDecision = null,
  specimenReviewRequired = false,
} = {}, {
  maxPayloadBytes = DEFAULT_ANALYSIS_JOB_MAX_PAYLOAD_BYTES,
} = {}) {
  if (!Array.isArray(images) || images.length < 1 || images.length > 4) {
    throw new Error('INF-SCALE-001.2B: queued analysis requires 1 to 4 images.');
  }

  const encodedImages = images.map(normalizeFile);
  const rawBytes = encodedImages.reduce((sum, image) => sum + image.size, 0);
  if (rawBytes > maxPayloadBytes) {
    const error = new Error('INF-SCALE-001.2B: durable analysis payload exceeds configured byte limit.');
    error.code = 'ANALYSIS_JOB_PAYLOAD_TOO_LARGE';
    error.statusCode = 413;
    throw error;
  }

  return {
    codecVersion: ANALYSIS_JOB_PAYLOAD_CODEC_VERSION,
    images: encodedImages,
    analysisSource: text(analysisSource, 'ai_visual'),
    manualCounts: cloneJson(manualCounts) ?? {},
    analysisType: analysisType == null ? null : text(analysisType),
    specimenType: specimenType == null ? null : text(specimenType),
    specimenDecision: cloneJson(specimenDecision),
    specimenReviewRequired: Boolean(specimenReviewRequired),
    payloadBytes: rawBytes,
  };
}

export function decodeAnalysisJobPayload(payload = {}) {
  if (payload?.codecVersion !== ANALYSIS_JOB_PAYLOAD_CODEC_VERSION) {
    throw new Error(`INF-SCALE-001.2B: unsupported analysis job payload codec ${payload?.codecVersion || 'unknown'}.`);
  }
  const images = Array.isArray(payload.images)
    ? payload.images.map((image) => {
        const buffer = Buffer.from(text(image.dataBase64), 'base64');
        return {
          fieldname: text(image.fieldname, 'image'),
          originalname: text(image.originalname, 'image'),
          encoding: text(image.encoding, '7bit'),
          mimetype: text(image.mimetype, 'application/octet-stream'),
          size: Number.isFinite(Number(image.size)) ? Number(image.size) : buffer.length,
          buffer,
        };
      })
    : [];

  return {
    images,
    analysisSource: text(payload.analysisSource, 'ai_visual'),
    manualCounts: cloneJson(payload.manualCounts) ?? {},
    analysisType: payload.analysisType == null ? null : text(payload.analysisType),
    specimenType: payload.specimenType == null ? null : text(payload.specimenType),
    specimenDecision: cloneJson(payload.specimenDecision),
    specimenReviewRequired: Boolean(payload.specimenReviewRequired),
  };
}
