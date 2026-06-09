import os
import json
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import get_current_user
from core.config import settings
from models.user import User
from models.cv_profile import CVProfile
from schemas.cv_profile import CVProfileOut, CVProfileUpdate
from services.cv_parser import parse_cv

router = APIRouter(prefix="/api/cv", tags=["cv"])


@router.post("/upload", response_model=CVProfileOut, status_code=201)
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Validate file size (5MB max)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 5MB")

    # Save file to disk
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(user_upload_dir, f"{file_id}.pdf")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Parse CV with AI
    structured_data = await parse_cv(file_path, model=current_user.preferred_model)

    # Upsert CV profile (one per user)
    result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = result.scalar_one_or_none()

    if cv_profile:
        cv_profile.raw_text = ""
        cv_profile.structured_data = json.dumps(structured_data)
        cv_profile.file_name = file.filename
        cv_profile.file_path = file_path
    else:
        cv_profile = CVProfile(
            user_id=current_user.id,
            raw_text="",
            structured_data=json.dumps(structured_data),
            file_name=file.filename,
            file_path=file_path,
        )
        db.add(cv_profile)

    await db.commit()
    await db.refresh(cv_profile)

    return _build_cv_out(cv_profile)


@router.get("/me", response_model=CVProfileOut)
async def get_my_cv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = result.scalar_one_or_none()

    if not cv_profile:
        raise HTTPException(status_code=404, detail="No CV uploaded yet")

    return _build_cv_out(cv_profile)


@router.put("/update", response_model=CVProfileOut)
async def update_cv(
    body: CVProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = result.scalar_one_or_none()

    if not cv_profile:
        raise HTTPException(status_code=404, detail="No CV found. Upload first.")

    cv_profile.structured_data = json.dumps(body.structured_data)
    await db.commit()
    await db.refresh(cv_profile)

    return _build_cv_out(cv_profile)


def _build_cv_out(cv_profile: CVProfile) -> CVProfileOut:
    structured = None
    if cv_profile.structured_data:
        try:
            structured = json.loads(cv_profile.structured_data)
        except Exception:
            structured = None

    return CVProfileOut(
        id=cv_profile.id,
        file_name=cv_profile.file_name,
        updated_at=cv_profile.updated_at,
        structured_data=structured,
    )
