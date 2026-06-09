import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Google OAuth tokens (stored only if user links their Google account)
    google_access_token: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    google_refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    google_token_expiry: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)

    # Global AI settings
    default_instructions: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    preferred_model: Mapped[str | None] = mapped_column(String, nullable=True, default="llama-3.3-70b-versatile")
    
    is_admin: Mapped[bool] = mapped_column(default=False)

    cv_profile: Mapped["CVProfile"] = relationship("CVProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship("Application", back_populates="user", cascade="all, delete-orphan")
