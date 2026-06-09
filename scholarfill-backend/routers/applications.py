import os
import json
import re
import uuid
import aiofiles
from datetime import datetime, timezone
from urllib.parse import urlencode, urlparse, parse_qs
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.application import Application
from schemas.application import ApplicationUpdate
from services.form_submitter import fill_and_submit

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("/")
async def list_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    applications = result.scalars().all()
    return [_build(a) for a in applications]


@router.get("/{application_id}")
async def get_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return _build(application)


@router.put("/{application_id}/review")
async def review_application(
    application_id: str,
    body: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save user-edited field values and mark as reviewed."""
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.filled_data = json.dumps(body.filled_data)
    application.status = "reviewed"
    await db.commit()
    await db.refresh(application)
    return _build(application)


@router.post("/{application_id}/submit")
async def submit_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Use Playwright to fill and submit the actual form."""
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status == "submitted":
        raise HTTPException(status_code=400, detail="Already submitted")

    form_fields = json.loads(application.form_fields) if application.form_fields else []
    filled_data = json.loads(application.filled_data) if application.filled_data else {}

    submit_result = await fill_and_submit(
        url=application.form_url,
        filled_data=filled_data,
        form_fields=form_fields,
        submit=True,
        is_google_form=bool(application.is_google_form),
    )

    if submit_result.get("success"):
        application.status = "submitted"
        application.submitted_at = datetime.now(timezone.utc)
        application.error_message = None
    else:
        application.status = "failed"
        application.error_message = submit_result.get("error", "Unknown error")

    application.screenshot_before = submit_result.get("screenshot_before")
    application.screenshot_after = submit_result.get("screenshot_after")

    await db.commit()
    await db.refresh(application)

    return {
        **_build(application),
        "screenshot_before": application.screenshot_before,
        "screenshot": application.screenshot_after,
    }


VALID_STATUSES = {"submitted", "failed", "pending", "reviewed"}

@router.post("/{application_id}/mark-status")
async def mark_status(
    application_id: str,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark an application's status manually.
    Used after the pre-fill URL flow — user confirms whether they submitted,
    skipped, or encountered an error in Google Forms.

    Body: { "status": "submitted" | "failed" | "pending" | "reviewed" }
    """
    status = body.get("status", "").strip()
    if status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}",
        )

    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = status
    if status == "submitted":
        application.submitted_at = datetime.now(timezone.utc)
        application.error_message = None
    elif status == "failed":
        application.error_message = body.get("error_message") or "User reported submission failed"
    await db.commit()
    await db.refresh(application)
    return _build(application)


@router.get("/{application_id}/prefill-url")
async def get_prefill_url(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Build a Google Forms pre-fill URL from stored entry_ids + filled_data.
    Opening this URL in the user's browser pre-populates all fields;
    the user just reviews and clicks Submit (using their own Google session).
    """
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if not application.is_google_form:
        return {"prefill_url": None, "reason": "Not a Google Form"}

    form_fields = json.loads(application.form_fields) if application.form_fields else []
    filled_data = json.loads(application.filled_data) if application.filled_data else {}

    # Use the fully-resolved URL (after any forms.gle redirect) as the base.
    # Short links like forms.gle/... do NOT support ?entry.xxx= pre-fill params.
    base_url = application.final_url or application.form_url

    # Safety: strip /edit if present, ensure /viewform suffix
    base_url = re.sub(r"/edit$", "/viewform", base_url)
    if "docs.google.com/forms" in base_url and "viewform" not in base_url:
        base_url = base_url.rstrip("/") + "/viewform"

    # Strip any existing query params
    base_url = base_url.split("?")[0]

    # Assemble entry params: entry.ENTRY_ID=value
    params = {}
    for field in form_fields:
        entry_id = field.get("entry_id")
        field_name = field.get("name")
        value = filled_data.get(field_name, "")
        if entry_id and value:
            params[f"entry.{entry_id}"] = str(value)

    if not params:
        return {"prefill_url": base_url, "reason": "No filled fields to pre-populate — re-scrape to fill fields"}

    prefill_url = base_url + "?" + urlencode(params, quote_via=lambda s, safe, encoding, errors: s.replace(" ", "+"))
    return {"prefill_url": prefill_url}


@router.delete("/{application_id}", status_code=204)
async def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.delete(application)
    await db.commit()


@router.post("/{application_id}/upload-field")
async def upload_field_file(
    application_id: str,
    field_name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from core.config import settings
    # Get the application to make sure it belongs to the user
    result = await db.execute(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Save the file to disk
    user_app_dir = os.path.join(settings.UPLOAD_DIR, current_user.id, "applications", application_id)
    os.makedirs(user_app_dir, exist_ok=True)
    
    # Generate a unique name
    file_id = str(uuid.uuid4())
    # Clean filename
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in (".", "_", "-"))
    disk_filename = f"{file_id}_{safe_filename}"
    file_path = os.path.join(user_app_dir, disk_filename)

    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Relative path accessible via static files mount
    relative_url = f"/uploads/{current_user.id}/applications/{application_id}/{disk_filename}"

    # Update application's filled_data
    filled_data = json.loads(application.filled_data) if application.filled_data else {}
    filled_data[field_name] = relative_url
    application.filled_data = json.dumps(filled_data)

    await db.commit()
    await db.refresh(application)

    return {
        "field_name": field_name,
        "file_url": relative_url,
        "application": _build(application)
    }


def _build(application: Application) -> dict:
    return {
        "id": application.id,
        "form_url": application.form_url,
        "form_title": application.form_title,
        "form_summary": application.form_summary,
        "user_instructions": application.user_instructions,
        "status": application.status,
        "is_google_form": bool(application.is_google_form),
        "created_at": application.created_at.isoformat(),
        "submitted_at": application.submitted_at.isoformat() if application.submitted_at else None,
        "form_fields": json.loads(application.form_fields) if application.form_fields else [],
        "filled_data": json.loads(application.filled_data) if application.filled_data else {},
        "error_message": application.error_message,
        "screenshot_before": application.screenshot_before,
        "screenshot_after": application.screenshot_after,
    }
