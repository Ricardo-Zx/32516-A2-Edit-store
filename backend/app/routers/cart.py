"""Shopping cart endpoints (read/add/update/delete for the current user).

One cart document per user with an embedded items array; totals are
recomputed from live product prices on every response.

Author: Yuchang Zhang
"""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException

from ..deps import CurrentUser, DbDep, to_object_id
from ..schemas import CartItemIn, CartItemOut, CartOut, CartUpdate, MessageResponse
from .auth import log_activity

router = APIRouter(prefix="/api/cart", tags=["cart"])


async def _build_cart_response(db, cart: dict | None) -> CartOut:
    if not cart or not cart.get("items"):
        return CartOut(items=[], total=0.0, item_count=0)

    product_ids = [to_object_id(item["product_id"]) for item in cart["items"]]
    products = {
        str(p["_id"]): p
        async for p in db.products.find({"_id": {"$in": product_ids}})
    }

    items_out: list[CartItemOut] = []
    total = 0.0
    item_count = 0
    for item in cart["items"]:
        product = products.get(item["product_id"])
        if not product:
            continue
        subtotal = float(product["price"]) * item["quantity"]
        total += subtotal
        item_count += item["quantity"]
        items_out.append(
            CartItemOut(
                product_id=item["product_id"],
                quantity=item["quantity"],
                name=product["name"],
                price=float(product["price"]),
                image=product["image"],
                color=product.get("color", ""),
                subtotal=round(subtotal, 2),
            )
        )

    return CartOut(items=items_out, total=round(total, 2), item_count=item_count)


async def _get_or_create_cart(db, user_id: ObjectId) -> dict:
    cart = await db.carts.find_one({"user_id": user_id})
    if cart:
        return cart
    now = datetime.now(timezone.utc)
    doc = {"user_id": user_id, "items": [], "created_at": now, "updated_at": now}
    result = await db.carts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


@router.get("", response_model=CartOut)
async def get_cart(current_user: CurrentUser, db: DbDep) -> CartOut:
    cart = await _get_or_create_cart(db, current_user["_id"])
    return await _build_cart_response(db, cart)


@router.post("/items", response_model=CartOut)
async def add_item(payload: CartItemIn, current_user: CurrentUser, db: DbDep) -> CartOut:
    product = await db.products.find_one({"_id": to_object_id(payload.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if product.get("stock", 0) <= 0:
        raise HTTPException(status_code=409, detail="Product is out of stock.")

    cart = await _get_or_create_cart(db, current_user["_id"])
    existing = next((it for it in cart["items"] if it["product_id"] == payload.product_id), None)
    next_quantity = payload.quantity
    if existing:
        next_quantity = existing["quantity"] + payload.quantity
    if next_quantity > min(99, int(product.get("stock", 0))):
        raise HTTPException(
            status_code=409,
            detail=f"Only {int(product.get('stock', 0))} item(s) left in stock.",
        )

    if existing:
        existing["quantity"] = next_quantity
    else:
        cart["items"].append({"product_id": payload.product_id, "quantity": payload.quantity})

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc)}},
    )
    await log_activity(db, current_user["_id"], "cart_add", product["name"])
    return await _build_cart_response(db, cart)


@router.put("/items/{product_id}", response_model=CartOut)
async def update_item(
    product_id: str,
    payload: CartUpdate,
    current_user: CurrentUser,
    db: DbDep,
) -> CartOut:
    product = await db.products.find_one({"_id": to_object_id(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    cart = await _get_or_create_cart(db, current_user["_id"])
    items = cart["items"]
    found = False
    new_items = []
    for item in items:
        if item["product_id"] == product_id:
            found = True
            if payload.quantity == 0:
                continue
            if payload.quantity > min(99, int(product.get("stock", 0))):
                raise HTTPException(
                    status_code=409,
                    detail=f"Only {int(product.get('stock', 0))} item(s) left in stock.",
                )
            item["quantity"] = payload.quantity
        new_items.append(item)

    if not found:
        raise HTTPException(status_code=404, detail="Item not in cart.")

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": new_items, "updated_at": datetime.now(timezone.utc)}},
    )
    cart["items"] = new_items
    return await _build_cart_response(db, cart)


@router.delete("/items/{product_id}", response_model=CartOut)
async def remove_item(product_id: str, current_user: CurrentUser, db: DbDep) -> CartOut:
    cart = await _get_or_create_cart(db, current_user["_id"])
    new_items = [item for item in cart["items"] if item["product_id"] != product_id]
    if len(new_items) == len(cart["items"]):
        raise HTTPException(status_code=404, detail="Item not in cart.")
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": new_items, "updated_at": datetime.now(timezone.utc)}},
    )
    cart["items"] = new_items
    await log_activity(db, current_user["_id"], "cart_remove", product_id)
    return await _build_cart_response(db, cart)


@router.delete("", response_model=MessageResponse)
async def clear_cart(current_user: CurrentUser, db: DbDep) -> MessageResponse:
    await db.carts.update_one(
        {"user_id": current_user["_id"]},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc)}},
    )
    await log_activity(db, current_user["_id"], "cart_clear")
    return MessageResponse(message="Cart cleared.")
