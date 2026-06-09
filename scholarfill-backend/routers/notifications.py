from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.notification import Notification
from schemas.notification import NotificationOut

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationOut])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get notifications for the user OR global notifications (user_id is None)
    result = await db.execute(
        select(Notification)
        .where(or_(Notification.user_id == current_user.id, Notification.user_id == None))
        .order_by(Notification.created_at.desc())
    )
    return result.scalars().all()

@router.put("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    # Only allow marking as read if it belongs to the user or is a global notification
    if notification.user_id is not None and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    notification.is_read = True
    await db.commit()
    return {"status": "ok"}
