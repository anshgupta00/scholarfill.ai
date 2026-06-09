import asyncio
from sqlalchemy import select
from core.database import AsyncSessionLocal
from models.user import User
from models.cv_profile import CVProfile
from models.application import Application
import sys

async def promote_user(email: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"User with email {email} not found.")
            return
            
        user.is_admin = True
        await db.commit()
        print(f"Successfully promoted {email} to admin!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
        sys.exit(1)
        
    email = sys.argv[1]
    
    # Use Windows selector for asyncio if needed
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(promote_user(email))
