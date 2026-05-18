"""User registration, login, and profile endpoints.

Hashes passwords with bcrypt, issues JWTs, and logs each auth event
to the user_activity collection for the admin feed.

Author: Yuchang Zhang
"""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from ..deps import CurrentUser, DbDep
from ..schemas import TokenOut, UserCreate, UserLogin, UserOut
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def serialize_user(user: dict) -> UserOut:
    return UserOut(
        id=str(user["_id"]),
        email=user["email"],
        username=user["username"],
        role=user.get("role", "user"),
        created_at=user["created_at"],
    )


async def log_activity(db, user_id, action: str, detail: str = "") -> None:
    await db.user_activity.insert_one(
        {
            "user_id": user_id,
            "action": action,
            "detail": detail,
            "created_at": datetime.now(timezone.utc),
        }
    )


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: DbDep) -> TokenOut:
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    now = datetime.now(timezone.utc)
    doc = {
        "email": payload.email.lower(),
        "username": payload.username.strip(),
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token(str(result.inserted_id), "user")
    await log_activity(db, result.inserted_id, "register", payload.email)
    return TokenOut(access_token=token, user=serialize_user(doc))


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin, db: DbDep) -> TokenOut:
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token(str(user["_id"]), user.get("role", "user"))
    await log_activity(db, user["_id"], "login")
    return TokenOut(access_token=token, user=serialize_user(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: CurrentUser) -> UserOut:
    return serialize_user(current_user)
