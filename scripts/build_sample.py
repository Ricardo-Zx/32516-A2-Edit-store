"""Pick a clean H&M sample organised by gender × category.

We deliberately skip underwear / socks / nightwear / swimwear so the storefront
shows mainstream pieces (tops, bottoms, dresses, outerwear, shoes, bags,
accessories), grouped under WOMEN / MEN / KIDS like Zara.

Author: Yuchang Zhang
"""
from __future__ import annotations

import json
import shutil
from collections import defaultdict
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "data" / "raw"
SAMPLE_DIR = PROJECT_ROOT / "data" / "sample"
IMAGES_OUT = SAMPLE_DIR / "images"

GENDER_MAP = {
    "Ladieswear": "women",
    "Divided": "women",
    "Menswear": "men",
    "Baby/Children": "kids",
}

CATEGORY_MAP = {
    "Garment Upper body": "Tops",
    "Garment Lower body": "Bottoms",
    "Garment Full body": "Dresses",
    "Shoes": "Shoes",
    "Bags": "Bags",
    "Accessories": "Accessories",
}

# How many products per (gender, category) combination.
TARGET_PER_BUCKET = {
    "women": 18,
    "men": 14,
    "kids": 10,
}

PRICE_BY_CATEGORY = {
    "Tops": 39.90,
    "Bottoms": 49.90,
    "Dresses": 89.90,
    "Shoes": 79.90,
    "Bags": 59.90,
    "Accessories": 19.90,
}


def main() -> None:
    articles = pd.read_csv(RAW_DIR / "articles.csv", dtype={"article_id": str})
    image_root = RAW_DIR / "images_256_256"

    articles = articles[articles["index_group_name"].isin(GENDER_MAP)]
    articles = articles[articles["product_group_name"].isin(CATEGORY_MAP)]

    if IMAGES_OUT.exists():
        shutil.rmtree(IMAGES_OUT)
    IMAGES_OUT.mkdir(parents=True, exist_ok=True)

    picked: list[dict] = []
    counts: dict[tuple[str, str], int] = defaultdict(int)

    for _, row in articles.iterrows():
        gender = GENDER_MAP[row["index_group_name"]]
        category = CATEGORY_MAP[row["product_group_name"]]
        bucket = (gender, category)
        if counts[bucket] >= TARGET_PER_BUCKET[gender]:
            continue

        article_id = row["article_id"]
        src = image_root / article_id[:3] / f"{article_id}.jpg"
        if not src.exists():
            continue

        shutil.copy(src, IMAGES_OUT / f"{article_id}.jpg")
        picked.append(
            {
                "article_id": article_id,
                "name": row["prod_name"],
                "description": row.get("detail_desc", "") or "",
                "gender": gender,
                "category": category,
                "product_type": row["product_type_name"],
                "color": row["colour_group_name"],
                "department": row["department_name"],
                "price": PRICE_BY_CATEGORY[category],
                "image": f"/images/{article_id}.jpg",
            }
        )
        counts[bucket] += 1

    out_file = SAMPLE_DIR / "products.json"
    out_file.write_text(json.dumps(picked, indent=2, ensure_ascii=False))

    print(f"Wrote {len(picked)} products to {out_file}")
    for (gender, category), count in sorted(counts.items()):
        print(f"  {gender:<6} {category:<12} {count}")


if __name__ == "__main__":
    main()
