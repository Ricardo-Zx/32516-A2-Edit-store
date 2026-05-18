from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

from bson import ObjectId
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.routers.cart import add_item  # noqa: E402
from app.routers.orders import checkout  # noqa: E402
from app.schemas import CartItemIn  # noqa: E402


def matches_query(doc: dict, query: dict) -> bool:
    if not query:
        return True
    for key, value in query.items():
        if isinstance(value, dict):
            if "$in" in value and doc.get(key) not in value["$in"]:
                return False
            if "$gte" in value and doc.get(key, 0) < value["$gte"]:
                return False
            if "$lte" in value and doc.get(key, 0) > value["$lte"]:
                return False
        elif doc.get(key) != value:
            return False
    return True


class FakeInsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeUpdateResult:
    def __init__(self, modified_count: int):
        self.modified_count = modified_count


class FakeCursor:
    def __init__(self, docs: list[dict]):
        self.docs = docs

    def sort(self, key, direction):
        reverse = direction == -1
        self.docs.sort(key=lambda doc: doc.get(key), reverse=reverse)
        return self

    def limit(self, count: int):
        self.docs = self.docs[:count]
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index >= len(self.docs):
            raise StopAsyncIteration
        doc = self.docs[self._index]
        self._index += 1
        return copy.deepcopy(doc)


class FakeCollection:
    def __init__(self, docs: list[dict] | None = None):
        self.docs = [copy.deepcopy(doc) for doc in (docs or [])]

    async def find_one(self, query: dict):
        for doc in self.docs:
            if matches_query(doc, query):
                return copy.deepcopy(doc)
        return None

    def find(self, query: dict | None = None):
        return FakeCursor([copy.deepcopy(doc) for doc in self.docs if matches_query(doc, query or {})])

    async def insert_one(self, doc: dict):
        stored = copy.deepcopy(doc)
        stored.setdefault("_id", ObjectId())
        self.docs.append(stored)
        return FakeInsertResult(stored["_id"])

    async def update_one(self, query: dict, update: dict):
        for index, doc in enumerate(self.docs):
            if not matches_query(doc, query):
                continue
            if "$set" in update:
                for key, value in update["$set"].items():
                    doc[key] = value
            if "$inc" in update:
                for key, value in update["$inc"].items():
                    doc[key] = doc.get(key, 0) + value
            self.docs[index] = doc
            return FakeUpdateResult(1)
        return FakeUpdateResult(0)

    async def update_many(self, query: dict, update: dict):
        modified = 0
        for index, doc in enumerate(self.docs):
            if not matches_query(doc, query):
                continue
            if "$pull" in update:
                for key, value in update["$pull"].items():
                    if isinstance(doc.get(key), list):
                        doc[key] = [
                            item
                            for item in doc[key]
                            if not all(item.get(k) == v for k, v in value.items())
                        ]
            if "$set" in update:
                for key, value in update["$set"].items():
                    doc[key] = value
            self.docs[index] = doc
            modified += 1
        return FakeUpdateResult(modified)


class FakeDb:
    def __init__(self, *, products=None, carts=None, orders=None, activity=None):
        self.products = FakeCollection(products)
        self.carts = FakeCollection(carts)
        self.orders = FakeCollection(orders)
        self.user_activity = FakeCollection(activity)


class CartOrdersTests(unittest.IsolatedAsyncioTestCase):
    async def test_add_item_rejects_quantity_beyond_stock(self):
        product_id = ObjectId()
        user_id = ObjectId()
        db = FakeDb(
            products=[
                {"_id": product_id, "name": "Dress", "price": 50.0, "image": "/x.jpg", "color": "Black", "stock": 2}
            ],
            carts=[{"_id": ObjectId(), "user_id": user_id, "items": []}],
        )

        with self.assertRaises(HTTPException) as ctx:
            await add_item(
                CartItemIn(product_id=str(product_id), quantity=3),
                {"_id": user_id},
                db,
            )

        self.assertEqual(ctx.exception.status_code, 409)

    async def test_checkout_creates_order_deducts_stock_and_clears_cart(self):
        product_id = ObjectId()
        user_id = ObjectId()
        cart_id = ObjectId()
        db = FakeDb(
            products=[
                {
                    "_id": product_id,
                    "name": "Boots",
                    "price": 80.0,
                    "image": "/boots.jpg",
                    "color": "Brown",
                    "stock": 5,
                }
            ],
            carts=[
                {
                    "_id": cart_id,
                    "user_id": user_id,
                    "items": [{"product_id": str(product_id), "quantity": 2}],
                }
            ],
        )

        order = await checkout({"_id": user_id}, db)

        self.assertEqual(order.item_count, 2)
        self.assertEqual(order.total, 160.0)
        self.assertEqual(len(db.orders.docs), 1)
        self.assertEqual(db.products.docs[0]["stock"], 3)
        self.assertEqual(db.carts.docs[0]["items"], [])

    async def test_checkout_rejects_when_stock_is_insufficient(self):
        product_id = ObjectId()
        user_id = ObjectId()
        db = FakeDb(
            products=[
                {
                    "_id": product_id,
                    "name": "Coat",
                    "price": 120.0,
                    "image": "/coat.jpg",
                    "color": "Grey",
                    "stock": 1,
                }
            ],
            carts=[
                {
                    "_id": ObjectId(),
                    "user_id": user_id,
                    "items": [{"product_id": str(product_id), "quantity": 2}],
                }
            ],
        )

        with self.assertRaises(HTTPException) as ctx:
            await checkout({"_id": user_id}, db)

        self.assertEqual(ctx.exception.status_code, 409)
        self.assertEqual(len(db.orders.docs), 0)
        self.assertEqual(db.products.docs[0]["stock"], 1)


if __name__ == "__main__":
    unittest.main()
