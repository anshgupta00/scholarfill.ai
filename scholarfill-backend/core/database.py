from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        from models.user import User
        from models.cv_profile import CVProfile
        from models.application import Application
        from models.opportunity import Opportunity
        from models.notification import Notification
        await conn.run_sync(Base.metadata.create_all)

        # Check and add columns if they don't exist
        from sqlalchemy import text
        result = await conn.execute(text("PRAGMA table_info(applications)"))
        columns = [row[1] for row in result.fetchall()]
        if "screenshot_before" not in columns:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN screenshot_before TEXT"))
        if "screenshot_after" not in columns:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN screenshot_after TEXT"))
        if "final_url" not in columns:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN final_url TEXT"))
        if "form_summary" not in columns:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN form_summary TEXT"))
        if "user_instructions" not in columns:
            await conn.execute(text("ALTER TABLE applications ADD COLUMN user_instructions TEXT"))

        # Migrate users table — add Google OAuth and global settings columns if missing
        result = await conn.execute(text("PRAGMA table_info(users)"))
        user_columns = [row[1] for row in result.fetchall()]
        if "google_access_token" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN google_access_token TEXT"))
        if "google_refresh_token" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN google_refresh_token TEXT"))
        if "google_token_expiry" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN google_token_expiry DATETIME"))
        if "default_instructions" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN default_instructions TEXT"))
        if "preferred_model" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN preferred_model TEXT"))
        if "is_admin" not in user_columns:
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0"))

        # Migrate opportunities table
        result = await conn.execute(text("PRAGMA table_info(opportunities)"))
        opp_columns = [row[1] for row in result.fetchall()]
        if "link" not in opp_columns:
            await conn.execute(text("ALTER TABLE opportunities ADD COLUMN link TEXT"))
