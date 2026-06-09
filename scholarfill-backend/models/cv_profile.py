import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class CVProfile(Base):
    __tablename__ = "cv_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=True)
    structured_data: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string
    file_name: Mapped[str] = mapped_column(String, nullable=True)
    file_path: Mapped[str] = mapped_column(String, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="cv_profile")
