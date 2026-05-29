
CELLCOUNT ENTERPRISE - YOLO DATASET

Total de imagens: 1212
Treino: 969
Validação: 243

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

yolo detect train data="C:\CCellCount_Enterprise v4\backend\ai\datasets\hematology_yolo\data.yaml" model=yolov8n.pt epochs=80 imgsz=640

