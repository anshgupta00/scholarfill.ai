"""
Google OAuth 2.0 integration for scholarfill.ai.

Allows users to connect their Google account so scholarfill.ai can scrape and
fill Google Forms that require authentication (sign-in to view).

Flow:
  GET /api/auth/google/login      — redirect user to Google consent screen
  GET /api/auth/google/callback   — exchange code for tokens, save to user
  GET /api/auth/google/status     — check if current user has Google connected
  DELETE /api/auth/google/unlink  — remove stored Google credentials

Scopes used:
  - openid (identity)
  - email (read email address)
  - https://www.googleapis.com/auth/userinfo.profile (read name)
  
  NOTE: We do NOT request Drive or Forms scopes. The tokens are used only to
  set authenticated browser cookies in Playwright so it can access restricted
  Google Forms on behalf of the user.
"""
import json
import httpx
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.config import settings
from core.database import get_db
from core.security import get_current_user, get_current_user_optional, create_access_token, hash_password
from models.user import User
import secrets

router = APIRouter(prefix="/api/auth/google", tags=["google-oauth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
SCOPES = [
    "openid",
    "email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def _credentials_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


@router.get("/login")
async def google_login(current_user: User | None = Depends(get_current_user_optional)):
    """Redirect the user to Google's OAuth 2.0 consent screen."""
    if not _credentials_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "Google OAuth is not configured. "
                "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file."
            ),
        )

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",      # get refresh_token
        "prompt": "consent",           # force consent so we always get refresh_token
        "state": current_user.id if current_user else "signin",
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return {"url": url}


@router.get("/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Google redirects here after the user approves.
    Exchange the authorization code for tokens and save them.
    """
    frontend_url = settings.FRONTEND_URL

    if error:
        return RedirectResponse(f"{frontend_url}/settings?google=error&reason={error}")

    if not code or not state:
        return RedirectResponse(f"{frontend_url}/settings?google=error&reason=missing_params")

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if token_resp.status_code != 200:
        return RedirectResponse(f"{frontend_url}/settings?google=error&reason=token_exchange_failed")

    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)  # seconds

    if not access_token:
        return RedirectResponse(f"{frontend_url}/auth/callback?error=no_access_token")

    if state == "signin":
        async with httpx.AsyncClient() as client:
            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
        if userinfo_resp.status_code != 200:
            return RedirectResponse(f"{frontend_url}/auth/callback?error=failed_to_get_userinfo")

        userinfo = userinfo_resp.json()
        email = userinfo.get("email")
        name = userinfo.get("name", "Google User")

        if not email:
            return RedirectResponse(f"{frontend_url}/auth/callback?error=no_email")

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                name=name,
                email=email,
                password=hash_password(secrets.token_urlsafe(32)),
            )
            db.add(user)

        user.google_access_token = access_token
        if refresh_token:
            user.google_refresh_token = refresh_token
        user.google_token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        await db.commit()
        await db.refresh(user)

        token = create_access_token({"sub": user.id})
        return RedirectResponse(f"{frontend_url}/auth/callback?token={token}")

    else:
        # Link to existing user (state = user_id)
        result = await db.execute(select(User).where(User.id == state))
        user = result.scalar_one_or_none()
        if not user:
            return RedirectResponse(f"{frontend_url}/settings?google=error&reason=user_not_found")

        user.google_access_token = access_token
        if refresh_token:
            user.google_refresh_token = refresh_token
        user.google_token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        await db.commit()

        return RedirectResponse(f"{frontend_url}/settings?google=connected")


@router.get("/status")
async def google_status(current_user: User = Depends(get_current_user)):
    """Return whether the current user has a Google account connected."""
    configured = _credentials_configured()
    connected = bool(current_user.google_refresh_token or current_user.google_access_token)
    expiry = current_user.google_token_expiry
    return {
        "oauth_configured": configured,
        "connected": connected,
        "token_expiry": expiry.isoformat() if expiry else None,
    }


@router.delete("/unlink")
async def google_unlink(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove stored Google OAuth tokens for this user."""
    current_user.google_access_token = None
    current_user.google_refresh_token = None
    current_user.google_token_expiry = None
    await db.commit()
    return {"detail": "Google account disconnected successfully"}


async def get_valid_access_token(user: User) -> str | None:
    """
    Return a valid Google access token for the user.
    Refreshes automatically if expired. Returns None if no tokens stored.

    Used by form_scraper.py to inject auth cookies into Playwright.
    """
    if not user.google_access_token and not user.google_refresh_token:
        return None

    # Check expiry (with 60s buffer)
    now = datetime.now(timezone.utc)
    expiry = user.google_token_expiry
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if expiry and (expiry - now).total_seconds() > 60:
        return user.google_access_token  # still valid

    # Token expired — refresh it
    if not user.google_refresh_token:
        return None

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": user.google_refresh_token,
                "grant_type": "refresh_token",
            },
        )

    if resp.status_code != 200:
        return None

    data = resp.json()
    return data.get("access_token")
