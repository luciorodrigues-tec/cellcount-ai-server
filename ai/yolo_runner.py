# ============================================================================
# CELLCOUNT ENTERPRISE
# YOLO RUNNER V1
# Python YOLOv8 inference bridge for Node.js
# ============================================================================

import json
import sys
import os
from pathlib import Path

try:
    from ultralytics import YOLO
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": "Ultralytics não instalado",
        "detail": str(e),
        "detections": []
    }))
    sys.exit(0)


# ============================================================================
# CONFIG
# ============================================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATHS = [
    BASE_DIR / "models" / "hematology_yolo.pt",
    BASE_DIR / ".." / "ai_engine" / "models" / "hematology_yolo.pt",
    BASE_DIR / ".." / ".." / "ai_engine" / "models" / "hematology_yolo.pt",
]


# ============================================================================
# HELPERS
# ============================================================================

def find_model():
    for path in MODEL_PATHS:
        if path.exists():
            return path
    return None


def normalize_label(label):
    text = str(label).lower().strip()

    aliases = {
        "blast": ["blast", "blasto", "blastos"],
        "neutrophil": ["neutrophil", "neutrofilo", "segmentado"],
        "band": ["band", "bastonete"],
        "lymphocyte": ["lymphocyte", "linfocito"],
        "monocyte": ["monocyte", "monocito"],
        "eosinophil": ["eosinophil", "eosinofilo"],
        "basophil": ["basophil", "basofilo"],
        "platelet": ["platelet", "plaqueta"],
        "erythroblast": ["erythroblast", "eritroblasto"],
        "schistocyte": ["schistocyte", "esquizocito"],
        "acanthocyte": ["acanthocyte", "acantocito"],
    }

    for canonical, terms in aliases.items():
        if any(term in text for term in terms):
            return canonical

    return text.replace(" ", "_")


def run_detection(image_path):
    model_path = find_model()

    if model_path is None:
        return {
            "success": False,
            "error": "Modelo YOLO não encontrado",
            "searchedPaths": [str(p) for p in MODEL_PATHS],
            "detections": []
        }

    if not os.path.exists(image_path):
        return {
            "success": False,
            "error": "Imagem não encontrada",
            "imagePath": image_path,
            "detections": []
        }

    model = YOLO(str(model_path))
    results = model(
        str(image_path),
        conf=0.05,
        iou=0.30,
        imgsz=640,
        verbose=False
    )

    detections = []

    for result in results:
        names = result.names

        if result.boxes is None:
            continue

        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()

            x1, y1, x2, y2 = xyxy

            raw_label = names.get(cls_id, str(cls_id))
            label = normalize_label(raw_label)

            detections.append({
                "class": label,
                "rawClass": raw_label,
                "confidence": round(conf, 4),
                "x": round(float(x1), 2),
                "y": round(float(y1), 2),
                "width": round(float(x2 - x1), 2),
                "height": round(float(y2 - y1), 2),
                "source": "yolov8"
            })

    return {
        "success": True,
        "model": str(model_path),
        "imagePath": image_path,
        "totalDetections": len(detections),
        "detections": detections
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Uso: python yolo_runner.py <image_path>",
            "detections": []
        }))
        sys.exit(0)

    image_path = sys.argv[1]

    result = run_detection(image_path)

    print(json.dumps(
        result,
        ensure_ascii=False
    ))