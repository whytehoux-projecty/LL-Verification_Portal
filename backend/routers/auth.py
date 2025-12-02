"""
Authentication endpoints for user login and registration
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from ..auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    Token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user
)
from ..database import AsyncSessionLocal
from ..models import User
from ..middleware.rate_limit import limiter
from sqlalchemy import select
import uuid

router = APIRouter(tags=["Authentication"])


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str


@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserRegister):
    """Register a new lawyer account"""
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        new_user = User(
            id=str(uuid.uuid4()),
            email=user_data.email,
            name=user_data.name,
            password_hash=get_password_hash(user_data.password)
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        return UserResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name
        )


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin):
    """Login and receive JWT token"""
    async with AsyncSessionLocal() as db:
        # Find user
        result = await db.execute(
            select(User).where(User.email == credentials.email)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current authenticated user information"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.id == current_user.user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name
        )
