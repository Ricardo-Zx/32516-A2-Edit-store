"""Admin-only endpoints to view users, carts, and activity logs.

Every route is gated by the CurrentAdmin dependency (role == "admin").

Author: Yuchang Zhang
"""
from datetime import datetime

from fastapi import APIRouter, Query
from pydantic import BaseModel, EmailStr

from datetime import timezone

from fastapi import HTTPException

from ..deps import CurrentAdmin, DbDep, to_object_id
from ..schemas import AdminCartView, AdminOrderView, OrderItemOut, OrderStatusUpdate
from .cart import _build_cart_response

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminUserOut(BaseModel):
    id: str
    email: EmailStr
    username: str
    role: str
    created_at: datetime


class ActivityOut(BaseModel):
    id: str
    user_id: str
    username: str
    action: str
    detail: str
    created_at: datetime


@router.get("/users", response_model=list[AdminUserOut])
async def list_users(db: DbDep, _: CurrentAdmin) -> list[AdminUserOut]:
    return [
        AdminUserOut(
            id=str(u["_id"]),
            email=u["email"],
            username=u["username"],
            role=u.get("role", "user"),
            created_at=u["created_at"],
        )
        async for u in db.users.find().sort("created_at", -1)
    ]


@router.get("/carts", response_model=list[AdminCartView])
async def list_all_carts(db: DbDep, _: CurrentAdmin) -> list[AdminCartView]:
    results: list[AdminCartView] = []
    async for cart in db.carts.find():
        user = await db.users.find_one({"_id": cart["user_id"]})
        if not user:
            continue
        cart_summary = await _build_cart_response(db, cart)
        results.append(
            AdminCartView(
                user_id=str(user["_id"]),
                username=user["username"],
                email=user["email"],
                items=cart_summary.items,
                total=cart_summary.total,
                item_count=cart_summary.item_count,
                updated_at=cart.get("updated_at"),
            )
        )
    results.sort(key=lambda c: c.updated_at or datetime.min, reverse=True)
    return results


@router.get("/orders", response_model=list[AdminOrderView])
async def list_orders(db: DbDep, _: CurrentAdmin) -> list[AdminOrderView]:
    results: list[AdminOrderView] = []
    async for order in db.orders.find().sort("created_at", -1):
        user = await db.users.find_one({"_id": order["user_id"]})
        if not user:
            continue
        results.append(
            AdminOrderView(
                id=str(order["_id"]),
                user_id=str(order["user_id"]),
                username=user["username"],
                email=user["email"],
                items=[OrderItemOut(**item) for item in order.get("items", [])],
                total=float(order.get("total", 0)),
                item_count=int(order.get("item_count", 0)),
                status=order.get("status", "placed"),
                created_at=order["created_at"],
            )
        )
    return results


@router.put("/orders/{order_id}", response_model=AdminOrderView)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: DbDep,
    _: CurrentAdmin,
) -> AdminOrderView:
    order = await db.orders.find_one_and_update(
        {"_id": to_object_id(order_id)},
        {"$set": {"status": payload.status, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    user = await db.users.find_one({"_id": order["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="Order user not found.")

    return AdminOrderView(
        id=str(order["_id"]),
        user_id=str(order["user_id"]),
        username=user["username"],
        email=user["email"],
        items=[OrderItemOut(**item) for item in order.get("items", [])],
        total=float(order.get("total", 0)),
        item_count=int(order.get("item_count", 0)),
        status=order.get("status", "placed"),
        created_at=order["created_at"],
    )


@router.get("/activity", response_model=list[ActivityOut])
async def list_activity(
    db: DbDep,
    _: CurrentAdmin,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[ActivityOut]:
    results: list[ActivityOut] = []
    cursor = db.user_activity.find().sort("created_at", -1).limit(limit)
    user_cache: dict = {}
    async for record in cursor:
        uid = record["user_id"]
        if uid not in user_cache:
            user_cache[uid] = await db.users.find_one({"_id": uid})
        user = user_cache[uid]
        results.append(
            ActivityOut(
                id=str(record["_id"]),
                user_id=str(uid),
                username=user["username"] if user else "(deleted)",
                action=record["action"],
                detail=record.get("detail", ""),
                created_at=record["created_at"],
            )
        )
    return results
