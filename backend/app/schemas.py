"""Pydantic request/response models.

Validation + serialisation contracts for users, products, carts and
admin views shared across all routers.

Author: Yuchang Zhang
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=40)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    username: str
    role: Literal["user", "admin"]
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut


class ProductBase(BaseModel):
    name: str
    description: str = ""
    gender: Literal["women", "men", "kids", "unisex"] = "unisex"
    category: str
    product_type: str = ""
    color: str = ""
    department: str = ""
    price: float = Field(ge=0)
    image: str
    stock: int = Field(default=100, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    gender: Literal["women", "men", "kids", "unisex"] | None = None
    category: str | None = None
    product_type: str | None = None
    color: str | None = None
    department: str | None = None
    price: float | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)


class ProductOut(ProductBase):
    id: str


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemOut(BaseModel):
    product_id: str
    quantity: int
    name: str
    price: float
    image: str
    color: str
    subtotal: float


class CartOut(BaseModel):
    items: list[CartItemOut]
    total: float
    item_count: int


class CartUpdate(BaseModel):
    quantity: int = Field(ge=0, le=99)


class AdminCartView(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    items: list[CartItemOut]
    total: float
    item_count: int
    updated_at: datetime | None = None


class MessageResponse(BaseModel):
    message: str
