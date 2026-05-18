"""Async MongoDB client wrapper.

Holds the Motor client/database singletons and the connect/close
helpers driven by the FastAPI lifespan.

Author: Yuchang Zhang
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import get_settings


class Database:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db = Database()


async def connect_to_mongo() -> None:
    settings = get_settings()
    db.client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=8000)
    db.db = db.client[settings.mongodb_db]
    await db.client.admin.command("ping")


async def close_mongo_connection() -> None:
    if db.client is not None:
        db.client.close()


def get_db() -> AsyncIOMotorDatabase:
    if db.db is None:
        raise RuntimeError("Database not initialised. Did the lifespan handler run?")
    return db.db
