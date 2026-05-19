"""Order checkout and history endpoints.

Creates immutable order snapshots from the current cart, decrements stock,
and exposes per-user order history.

Author: OpenAI Codex
"""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from ..deps import CurrentUser, DbDep, to_object_id
from ..schemas import OrderItemOut, OrderOut
from .auth import log_activity
from .cart import _get_or_create_cart

router = APIRouter(prefix="/api/orders", tags=["orders"])


def serialize_order(doc: dict) -> OrderOut:
    return OrderOut(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        items=[OrderItemOut(**item) for item in doc.get("items", [])],
        total=float(doc.get("total", 0)),
        item_count=int(doc.get("item_count", 0)),
        status=doc.get("status", "placed"),
        created_at=doc["created_at"],
        updated_at=doc.get("updated_at"),
    )


async def _reserve_stock(db, items: list[dict]) -> None:
    reserved: list[tuple[str, int]] = []
    try:
        for item in items:
            result = await db.products.update_one(
                {
                    "_id": to_object_id(item["product_id"]),
                    "stock": {"$gte": item["quantity"]},
                },
                {"$inc": {"stock": -item["quantity"]}},
            )
            if result.modified_count != 1:
                raise HTTPException(
                    status_code=409,
                    detail=f"Not enough stock for {item['name']}.",
                )
            reserved.append((item["product_id"], item["quantity"]))
    except Exception:
        for product_id, quantity in reserved:
            await db.products.update_one(
                {"_id": to_object_id(product_id)},
                {"$inc": {"stock": quantity}},
            )
        raise


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def checkout(current_user: CurrentUser, db: DbDep) -> OrderOut:
    cart = await _get_or_create_cart(db, current_user["_id"])
    if not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty.")

    order_items: list[dict] = []
    total = 0.0
    item_count = 0
    for cart_item in cart["items"]:
        product = await db.products.find_one({"_id": to_object_id(cart_item["product_id"])})
        if not product:
            raise HTTPException(status_code=404, detail="A cart item no longer exists.")
        if product.get("stock", 0) < cart_item["quantity"]:
            raise HTTPException(
                status_code=409,
                detail=f"Not enough stock for {product['name']}.",
            )
        subtotal = round(float(product["price"]) * cart_item["quantity"], 2)
        total += subtotal
        item_count += cart_item["quantity"]
        order_items.append(
            {
                "product_id": cart_item["product_id"],
                "quantity": cart_item["quantity"],
                "name": product["name"],
                "price": float(product["price"]),
                "image": product["image"],
                "color": product.get("color", ""),
                "subtotal": subtotal,
            }
        )

    await _reserve_stock(db, order_items)

    now = datetime.now(timezone.utc)
    order_doc = {
        "user_id": current_user["_id"],
        "items": order_items,
        "total": round(total, 2),
        "item_count": item_count,
        "status": "placed",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": [], "updated_at": now}},
    )
    await log_activity(db, current_user["_id"], "checkout", f"{item_count} item(s)")
    return serialize_order(order_doc)


@router.get("", response_model=list[OrderOut])
async def list_my_orders(current_user: CurrentUser, db: DbDep) -> list[OrderOut]:
    return [
        serialize_order(doc)
        async for doc in db.orders.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    ]


@router.post("/{order_id}/cancel", response_model=OrderOut)
async def cancel_my_order(order_id: str, current_user: CurrentUser, db: DbDep) -> OrderOut:
    order = await db.orders.find_one({"_id": to_object_id(order_id), "user_id": current_user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    current_status = order.get("status", "placed")
    if current_status == "cancelled":
        return serialize_order(order)
    if current_status == "shipped":
        raise HTTPException(status_code=409, detail="Shipped orders can no longer be cancelled.")

    for item in order.get("items", []):
        await db.products.update_one(
            {"_id": to_object_id(item["product_id"])},
            {"$inc": {"stock": int(item["quantity"])}},
        )

    updated_at = datetime.now(timezone.utc)
    updated = await db.orders.find_one_and_update(
        {"_id": to_object_id(order_id), "user_id": current_user["_id"]},
        {"$set": {"status": "cancelled", "updated_at": updated_at}},
        return_document=True,
    )
    await log_activity(db, current_user["_id"], "order_cancel", str(order["_id"]))
    return serialize_order(updated)
