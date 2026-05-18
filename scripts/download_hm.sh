#!/bin/bash
# Download the H&M Kaggle dataset (images + articles metadata) into
# data/raw/ so build_sample.py can carve out the storefront sample.
#
# Author: Yuchang Zhang
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW_DIR="$PROJECT_ROOT/data/raw"
SAMPLE_DIR="$PROJECT_ROOT/data/sample"

mkdir -p "$RAW_DIR" "$SAMPLE_DIR/images"

echo "[1/3] Downloading H&M 256x256 dataset (~2.3GB) from Kaggle..."
cd "$RAW_DIR"
kaggle datasets download -d odins0n/hm256x256 --unzip

echo "[2/3] Downloading articles metadata (~30MB)..."
kaggle competitions download -c h-and-m-personalized-fashion-recommendations -f articles.csv
unzip -o articles.csv.zip && rm articles.csv.zip

echo "[3/3] Done. Run: python scripts/build_sample.py"
