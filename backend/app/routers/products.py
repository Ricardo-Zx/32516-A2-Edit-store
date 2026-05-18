"""Product catalog endpoints (public list + admin CRUD).

Public read with keyword search, gender/category/price filters and
server-side sorting; create/update/delete restricted to admins.

Author: Yuchang Zhang
"""
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from ..deps import CurrentAdmin, DbDep, to_object_id
from ..schemas import MessageResponse, ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["products"])

# Maps the public `sort` query value to a MongoDB sort spec.
SORT_OPTIONS: dict[str, list[tuple[str, int]]] = {
    "newest": [("created_at", -1)],
    "price_asc": [("price", 1)],
    "price_desc": [("price", -1)],
    "name": [("name", 1)],
}


def serialize_product(doc: dict) -> ProductOut:
    return ProductOut(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        gender=doc.get("gender", "unisex"),
        category=doc.get("category", ""),
        product_type=doc.get("product_type", ""),
        color=doc.get("color", ""),
        department=doc.get("department", ""),
        price=float(doc.get("price", 0)),
        image=doc.get("image", ""),
        stock=int(doc.get("stock", 0)),
    )


@router.get("", response_model=list[ProductOut])
async def list_products(
    db: DbDep,
    q: str | None = Query(default=None, description="Search keyword"),
    gender: str | None = None,
    category: str | None = None,
    color: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: Literal["newest", "price_asc", "price_desc", "name"] = "newest",
    limit: int = Query(default=200, ge=1, le=500),
) -> list[ProductOut]:
    query: dict = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"product_type": {"$regex": q, "$options": "i"}},
            {"color": {"$regex": q, "$options": "i"}},
        ]
    if gender:
        query["gender"] = gender
    if category:
        query["category"] = category
    if color:
        query["color"] = color

    price_filter: dict = {}
    if min_price is not None:
        price_filter["$gte"] = min_price
    if max_price is not None:
        price_filter["$lte"] = max_price
    if price_filter:
        query["price"] = price_filter

    cursor = db.products.find(query).sort(SORT_OPTIONS[sort]).limit(limit)
    return [serialize_product(doc) async for doc in cursor]


@router.get("/categories", response_model=list[str])
async def list_categories(db: DbDep) -> list[str]:
    return sorted(await db.products.distinct("category"))


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, db: DbDep) -> ProductOut:
    doc = await db.products.find_one({"_id": to_object_id(product_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found.")
    return serialize_product(doc)


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(payload: ProductCreate, db: DbDep, _: CurrentAdmin) -> ProductOut:
    now = datetime.now(timezone.utc)
    doc = payload.model_dump()
    doc.update({"created_at": now, "updated_at": now})
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_product(doc)


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: DbDep,
    _: CurrentAdmin,
) -> ProductOut:
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    updates["updated_at"] = datetime.now(timezone.utc)

    result = await db.products.find_one_and_update(
        {"_id": to_object_id(product_id)},
        {"$set": updates},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found.")
    return serialize_product(result)


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(product_id: str, db: DbDep, _: CurrentAdmin) -> MessageResponse:
    result = await db.products.delete_one({"_id": to_object_id(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")
    await db.carts.update_many({}, {"$pull": {"items": {"product_id": product_id}}})
    return MessageResponse(message="Product deleted.")
