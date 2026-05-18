"""Seed MongoDB with products, images, and an admin account.

Wipes the products collection, reloads it from data/sample/products.json,
copies the matching images into backend/static/images/, and ensures the
demo admin + user accounts exist.

Usage (from project root):
    python backend/seed.py

Author: Yuchang Zhang
"""
from __future__ import annotations

import asyncio
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.config import get_settings  # noqa: E402
from app.security import hash_password  # noqa: E402

SAMPLE_DIR = PROJECT_ROOT / "data" / "sample"
STATIC_IMAGES_DIR = BACKEND_DIR / "static" / "images"

DEFAULT_ADMIN_EMAIL = "admin@example.com"
DEFAULT_ADMIN_PASSWORD = "Admin@123"
DEFAULT_USER_EMAIL = "demo@example.com"
DEFAULT_USER_PASSWORD = "Demo@123"


async def copy_images() -> None:
    src = SAMPLE_DIR / "images"
    if not src.exists():
        print(f"[seed] No images at {src}, skipping copy")
        return
    if STATIC_IMAGES_DIR.exists():
        shutil.rmtree(STATIC_IMAGES_DIR)
    STATIC_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    for path in src.glob("*.jpg"):
        shutil.copy(path, STATIC_IMAGES_DIR / path.name)
        copied += 1
    print(f"[seed] Copied {copied} images to {STATIC_IMAGES_DIR}")


async def seed_products(db) -> None:
    products_file = SAMPLE_DIR / "products.json"
    if not products_file.exists():
        print(f"[seed] {products_file} not found, run scripts/build_sample.py first")
        return

    products = json.loads(products_file.read_text())
    now = datetime.now(timezone.utc)

    await db.products.delete_many({})
    docs = []
    for item in products:
        docs.append(
            {
                "name": item["name"],
                "description": item.get("description", "") or "",
                "gender": item.get("gender", "unisex"),
                "category": item["category"],
                "product_type": item.get("product_type", ""),
                "color": item.get("color", ""),
                "department": item.get("department", ""),
                "price": float(item["price"]),
                "image": f"/static/images/{Path(item['image']).name}",
                "stock": 100,
                "created_at": now,
                "updated_at": now,
            }
        )
    if docs:
        await db.products.insert_many(docs)
    print(f"[seed] Inserted {len(docs)} products")

    await db.products.create_index("category")
    await db.products.create_index("gender")
    await db.products.create_index([("name", "text"), ("description", "text")])


async def seed_users(db) -> None:
    now = datetime.now(timezone.utc)

    if not await db.users.find_one({"email": DEFAULT_ADMIN_EMAIL}):
        await db.users.insert_one(
            {
                "email": DEFAULT_ADMIN_EMAIL,
                "username": "admin",
                "password_hash": hash_password(DEFAULT_ADMIN_PASSWORD),
                "role": "admin",
                "created_at": now,
                "updated_at": now,
            }
        )
        print(f"[seed] Created admin: {DEFAULT_ADMIN_EMAIL} / {DEFAULT_ADMIN_PASSWORD}")
    else:
        print(f"[seed] Admin already exists: {DEFAULT_ADMIN_EMAIL}")

    if not await db.users.find_one({"email": DEFAULT_USER_EMAIL}):
        await db.users.insert_one(
            {
                "email": DEFAULT_USER_EMAIL,
                "username": "demo",
                "password_hash": hash_password(DEFAULT_USER_PASSWORD),
                "role": "user",
                "created_at": now,
                "updated_at": now,
            }
        )
        print(f"[seed] Created demo user: {DEFAULT_USER_EMAIL} / {DEFAULT_USER_PASSWORD}")

    await db.users.create_index("email", unique=True)


async def main() -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db]

    try:
        await client.admin.command("ping")
        await copy_images()
        await seed_products(db)
        await seed_users(db)
        print("[seed] Done.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
