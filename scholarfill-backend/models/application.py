import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    form_url: Mapped[str] = mapped_column(String, nullable=False)          # original URL entered by user
    final_url: Mapped[str] = mapped_column(String, nullable=True)           # resolved URL after redirects
    form_title: Mapped[str] = mapped_column(String, nullable=True)
    form_summary: Mapped[str] = mapped_column(Text, nullable=True)
    user_instructions: Mapped[str] = mapped_column(Text, nullable=True)
    form_fields: Mapped[str] = mapped_column(Text, nullable=True)   # JSON string
    filled_data: Mapped[str] = mapped_column(Text, nullable=True)   # JSON string
    is_google_form: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | reviewed | submitted | failed
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    screenshot_before: Mapped[str] = mapped_column(Text, nullable=True)
    screenshot_after: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="applications")
