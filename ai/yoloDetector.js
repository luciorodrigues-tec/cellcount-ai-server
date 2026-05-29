// ============================================================================
// CELLCOUNT ENTERPRISE
// YOLO DETECTOR SERVICE V1
// SAFE PLACEHOLDER FOR REAL YOLO INTEGRATION
// ============================================================================

console.log(
  "🎯 YOLO DETECTOR SERVICE V1 LOADED",
);

export async function runYoloDetection({
  images = [],
} = {}) {
  try {
    if (!Array.isArray(images) || images.length === 0) {
      return [];
    }

    // =========================================================
    // PLACEHOLDER SEGURO
    // =========================================================
    // Aqui futuramente conectaremos:
    // - Python YOLOv8 local
    // - API interna FastAPI
    // - modelo .pt treinado
    // - retorno de bounding boxes reais
    //
    // Formato esperado:
    // [
    //   {
    //     class: "neutrophil",
    //     confidence: 0.91,
    //     x: 120,
    //     y: 88,
    //     width: 64,
    //     height: 64
    //   }
    // ]

    return [];
  } catch (error) {
    console.error(
      "YOLO DETECTION ERROR:",
      error,
    );

    return [];
  }
}