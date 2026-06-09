from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import hash_password, verify_password, create_access_token, get_current_user
from models.user import User
from schemas.user import UserRegister, UserLogin, TokenResponse, UserOut, UserSettingsUpdate

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    email = body.email.lower()
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    user_out = UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=_make_avatar(user.name),
        created_at=user.created_at,
        default_instructions=None,
        preferred_model="llama-3.3-70b-versatile",
        is_admin=user.is_admin,
    )
    return TokenResponse(token=token, user=user_out)


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    email = body.email.lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    user_out = UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=_make_avatar(user.name),
        created_at=user.created_at,
        default_instructions=user.default_instructions,
        preferred_model=user.preferred_model or "llama-3.3-70b-versatile",
        is_admin=user.is_admin,
    )
    return TokenResponse(token=token, user=user_out)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar=_make_avatar(current_user.name),
        created_at=current_user.created_at,
        default_instructions=current_user.default_instructions,
        preferred_model=current_user.preferred_model or "llama-3.3-70b-versatile",
        is_admin=current_user.is_admin,
    )


@router.put("/settings", response_model=UserOut)
async def update_settings(
    body: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.default_instructions is not None:
        current_user.default_instructions = body.default_instructions
    if body.preferred_model is not None:
        current_user.preferred_model = body.preferred_model
    await db.commit()
    await db.refresh(current_user)
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar=_make_avatar(current_user.name),
        created_at=current_user.created_at,
        default_instructions=current_user.default_instructions,
        preferred_model=current_user.preferred_model or "llama-3.3-70b-versatile",
        is_admin=current_user.is_admin,
    )


def _make_avatar(name: str) -> str:
    """Return initials from name, e.g. 'Ansh Gupta' → 'AG'"""
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return name[:2].upper() if name else "?"
