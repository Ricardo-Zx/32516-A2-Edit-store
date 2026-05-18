"""Admin-only endpoints to view users, carts, and activity logs.

Every route is gated by the CurrentAdmin dependency (role == "admin").

Author: Yuchang Zhang
"""
from datetime import datetime

from fastapi import APIRouter, Query
from pydantic import BaseModel, EmailStr

from ..deps import CurrentAdmin, DbDep
from ..schemas import AdminCartView
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
