import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.cv_profile import CVProfile
from models.application import Application
from services.form_scraper import scrape_form
from services.ai_mapper import map_cv_to_form, generate_form_summary
from services.form_submitter import fill_and_submit
from routers.google_auth import get_valid_access_token

router = APIRouter(prefix="/api/forms", tags=["forms"])


class ScrapeRequest(BaseModel):
    url: str
    html: str | None = None
    user_instructions: str | None = None


class FillRequest(BaseModel):
    application_id: str
    user_instructions: str | None = None


class PreviewRequest(BaseModel):
    application_id: str


@router.post("/scrape")
async def scrape_and_fill(
    body: ScrapeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Open the URL, scrape form fields, map CV to fields using AI.
    Creates a new Application record and returns it.
    """
    # Get user's CV
    cv_result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = cv_result.scalar_one_or_none()

    cv_data = {}
    if cv_profile and cv_profile.structured_data:
        try:
            cv_data = json.loads(cv_profile.structured_data)
        except Exception:
            cv_data = {}

    # Scrape the form — pass Google token if user has one connected
    google_token = await get_valid_access_token(current_user)
    try:
        scraped = await scrape_form(body.url, google_access_token=google_token, html=body.html)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not open or scrape the form: {str(e)}")

    form_fields = scraped.get("fields", [])
    form_title = scraped.get("title", "Untitled Form")
    form_description = scraped.get("description", "")
    is_google_form = scraped.get("is_google_form", False)

    # Determine user instructions: body.user_instructions OR current_user.default_instructions
    instructions = body.user_instructions if body.user_instructions is not None else current_user.default_instructions

    # Generate form summary
    try:
        form_summary = await generate_form_summary(form_title, form_description, form_fields, model=current_user.preferred_model)
    except Exception:
        form_summary = form_description or "No summary available."

    # AI fill
    filled_data = {}
    if form_fields:
        try:
            filled_data = await map_cv_to_form(
                cv_data=cv_data,
                form_fields=form_fields,
                form_title=form_title,
                form_description=form_description,
                user_instructions=instructions,
                model=current_user.preferred_model,
            )
        except Exception:
            filled_data = {}

    # Save application
    application = Application(
        user_id=current_user.id,
        form_url=body.url,
        final_url=scraped.get("final_url") or body.url,  # resolved URL post-redirect
        form_title=form_title,
        form_summary=form_summary,
        user_instructions=instructions,
        form_fields=json.dumps(form_fields),
        filled_data=json.dumps(filled_data),
        is_google_form=is_google_form,
        status="pending",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    return _build_app_response(application)


@router.post("/fill")
async def refill_application(
    body: FillRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-run AI fill on an existing application."""
    result = await db.execute(
        select(Application).where(
            Application.id == body.application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Get CV
    cv_result = await db.execute(select(CVProfile).where(CVProfile.user_id == current_user.id))
    cv_profile = cv_result.scalar_one_or_none()
    cv_data = json.loads(cv_profile.structured_data) if cv_profile and cv_profile.structured_data else {}

    if body.user_instructions is not None:
        application.user_instructions = body.user_instructions

    form_fields = json.loads(application.form_fields) if application.form_fields else []

    filled_data = await map_cv_to_form(
        cv_data=cv_data,
        form_fields=form_fields,
        form_title=application.form_title or "",
        form_summary=application.form_summary or "",
        user_instructions=application.user_instructions,
        model=current_user.preferred_model,
    )
    application.filled_data = json.dumps(filled_data)
    application.status = "pending"

    await db.commit()
    await db.refresh(application)

    return _build_app_response(application)


@router.post("/preview")
async def preview_application(
    body: PreviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fill the form in browser and return a screenshot (no submit)."""
    result = await db.execute(
        select(Application).where(
            Application.id == body.application_id,
            Application.user_id == current_user.id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    form_fields = json.loads(application.form_fields) if application.form_fields else []
    filled_data = json.loads(application.filled_data) if application.filled_data else {}
    is_google_form = bool(application.is_google_form)

    result_data = await fill_and_submit(
        url=application.form_url,
        filled_data=filled_data,
        form_fields=form_fields,
        submit=False,
        is_google_form=is_google_form,
    )

    return {
        "screenshot_before": result_data.get("screenshot_before"),
        "screenshot": result_data.get("screenshot_after"),
    }


def _build_app_response(application: Application) -> dict:
    return {
        "id": application.id,
        "form_url": application.form_url,
        "final_url": application.final_url or application.form_url,
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
    }
