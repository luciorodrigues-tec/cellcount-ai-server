
# Banco de Dados Hematológico

Este pacote contém:

- Estrutura de pastas para cada distúrbio hematológico
- Template de metadados CSV
- Lista de fontes científicas e atlas médicos
- Organização pronta para IA / Deep Learning

## Recomendação

Adicionar:
- 20 imagens por categoria
- Resolução mínima: 512x512
- Preferir coloração Wright-Giemsa

## Fontes principais

- Atlas UFG
- ASH Image Bank
- PubMed Central
- ALL-IDB
- Cell Image Library

## Organização

Cada pasta representa uma classe hematológica.
As imagens podem ser JPG ou PNG.

Exemplo:
anisocitose/
    anisocitose_001.jpg
    anisocitose_002.jpg

## Uso para IA

Compatível com:
- YOLO
- CNN
- PyTorch
- TensorFlow
- Detectron2
