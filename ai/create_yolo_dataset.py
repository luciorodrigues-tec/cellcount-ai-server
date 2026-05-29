# ============================================================================
# CELLCOUNT ENTERPRISE
# CREATE YOLO DATASET V1
# Organiza imagens em formato YOLO para anotação/treino
# ============================================================================

import os
import random
import shutil
from pathlib import Path

# ============================================================================
# CONFIG
# ============================================================================

BASE_DIR = Path(__file__).resolve().parent

SOURCE_DIR = BASE_DIR / "models"

OUTPUT_DIR = BASE_DIR / "datasets" / "hematology_yolo"

TRAIN_RATIO = 0.8

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp",
}

IGNORED_DIRS = {
    "datasets",
    "models",
    "__pycache__",
}

# ============================================================================
# CLASSES
# ============================================================================

CLASSES = [
    "Acantocitos",
    "Agregacao_Plaquetaria",
    "Anisocitose",
    "Basofilo",
    "Bastonete",
    "Codocitos",
    "Dacriocitos",
    "Drepanocitos",
    "Eliptocitos",
    "Eosinofilo",
    "Esquizocitos",
    "Estomatocitos",
    "Flower_Cell",
    "Granulacoes_Toxicas",
    "Hairy_Cells",
    "Hemacias_Crenadas",
    "Hemacias_Macrociticas",
    "Hemacias_Microciticas",
    "Howell_Jolly",
    "Leucemia_Prolinfocitica",
    "Linfoblasto",
    "Linfocito",
    "Linfocito_Atipico",
    "Linfoma",
    "LLA",
    "LLC",
    "LMA_M2",
    "LMA_M3",
    "LMA_M4",
    "LMA_M4_Eosinofilica",
    "LMC",
    "Macroplaquetas",
    "Manchas_Gumprecht",
    "Medula_Aplasica",
    "Medula_Infiltrada",
    "Medula_Ossea_Normal",
    "Metamielocito",
    "Mieloblasto",
    "Mielocito",
    "Mieloma_Multiplo",
    "Monoblasto",
    "Monocito",
    "Monocitos_Vacuolizados",
    "Neutrofilos_Hipersegmentados",
    "Neutrofilo_Segmentado",
    "Ovalocitos",
    "Plaquetas_Normais",
    "Plasmocito",
    "Plasmodium_Falciparum",
    "Plasmodium_Vivax",
    "Poiquilocitose",
    "Policitemia_Vera",
    "Policromasia",
    "Pontilhado_Basofilico",
    "Prolinfocito",
    "Promielocito",
    "Promonocito",
    "Reticulócitos",
    "Rouleaux",
    "Trypanosoma_Cruzi",
]

# ============================================================================
# HELPERS
# ============================================================================

def safe_name(name: str) -> str:
    return (
        name.replace(" ", "_")
        .replace("/", "_")
        .replace("\\", "_")
        .replace("ç", "c")
        .replace("Ç", "C")
        .replace("ó", "o")
        .replace("Ó", "O")
        .replace("í", "i")
        .replace("Í", "I")
        .replace("á", "a")
        .replace("Á", "A")
        .replace("é", "e")
        .replace("É", "E")
        .replace("ã", "a")
        .replace("Ã", "A")
        .replace("õ", "o")
        .replace("Õ", "O")
        .replace("ú", "u")
        .replace("Ú", "U")
    )


def reset_dir(path: Path):
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def collect_images():
    dataset = []

    for class_index, class_name in enumerate(CLASSES):
        class_dir = SOURCE_DIR / class_name

        if not class_dir.exists():
            continue

        for file in class_dir.iterdir():
            if file.suffix.lower() in IMAGE_EXTENSIONS:
                dataset.append({
                    "class_index": class_index,
                    "class_name": class_name,
                    "path": file,
                })

    return dataset


def create_empty_label(label_path: Path):
    # IMPORTANTE:
    # Labels vazios NÃO treinam detecção.
    # Servem apenas para preparar o dataset para anotação.
    label_path.write_text("", encoding="utf-8")


def copy_item(item, split):
    class_name = safe_name(item["class_name"])
    original = item["path"]

    new_stem = f"{class_name}_{original.stem}"

    image_dst = OUTPUT_DIR / "images" / split / f"{new_stem}{original.suffix.lower()}"
    label_dst = OUTPUT_DIR / "labels" / split / f"{new_stem}.txt"

    image_dst.parent.mkdir(parents=True, exist_ok=True)
    label_dst.parent.mkdir(parents=True, exist_ok=True)

    shutil.copy2(original, image_dst)
    create_empty_label(label_dst)


def write_data_yaml():
    yaml_path = OUTPUT_DIR / "data.yaml"

    names = "\n".join(
        [f"  {i}: {safe_name(name)}" for i, name in enumerate(CLASSES)]
    )

    content = f"""path: {OUTPUT_DIR.as_posix()}
train: images/train
val: images/val

nc: {len(CLASSES)}
names:
{names}
"""

    yaml_path.write_text(content, encoding="utf-8")


def write_readme(total, train_count, val_count):
    readme = OUTPUT_DIR / "README_IMPORTANTE.txt"

    content = f"""
CELLCOUNT ENTERPRISE - YOLO DATASET

Total de imagens: {total}
Treino: {train_count}
Validação: {val_count}

ATENÇÃO:
Este script organiza as imagens em formato YOLO,
mas NÃO cria bounding boxes reais.

Os arquivos .txt foram criados vazios apenas para anotação.

Para treinar YOLO de verdade, você precisa anotar as imagens com:
- LabelImg
- CVAT
- Roboflow
- makesense.ai

Formato esperado em cada .txt:

classe x_centro y_centro largura altura

Exemplo:

0 0.512 0.438 0.120 0.140

Depois de anotar, treine com:

yolo detect train data="{OUTPUT_DIR / "data.yaml"}" model=yolov8n.pt epochs=80 imgsz=640

"""

    readme.write_text(content, encoding="utf-8")


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("🧬 CELLCOUNT - Criando dataset YOLO...")

    if not SOURCE_DIR.exists():
        print(f"❌ Pasta fonte não encontrada: {SOURCE_DIR}")
        return

    reset_dir(OUTPUT_DIR / "images" / "train")
    reset_dir(OUTPUT_DIR / "images" / "val")
    reset_dir(OUTPUT_DIR / "labels" / "train")
    reset_dir(OUTPUT_DIR / "labels" / "val")

    dataset = collect_images()

    if not dataset:
        print("❌ Nenhuma imagem encontrada.")
        return

    random.shuffle(dataset)

    split_index = int(len(dataset) * TRAIN_RATIO)

    train_items = dataset[:split_index]
    val_items = dataset[split_index:]

    for item in train_items:
        copy_item(item, "train")

    for item in val_items:
        copy_item(item, "val")

    write_data_yaml()
    write_readme(
        total=len(dataset),
        train_count=len(train_items),
        val_count=len(val_items),
    )

    print("✅ Dataset YOLO criado com sucesso!")
    print(f"📁 Saída: {OUTPUT_DIR}")
    print(f"🖼️ Total: {len(dataset)}")
    print(f"🏋️ Treino: {len(train_items)}")
    print(f"🧪 Validação: {len(val_items)}")
    print("")
    print("⚠️ IMPORTANTE:")
    print("Os labels .txt estão vazios.")
    print("Você ainda precisa anotar bounding boxes reais.")


if __name__ == "__main__":
    main()