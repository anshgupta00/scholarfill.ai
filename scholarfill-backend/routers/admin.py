from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import get_current_admin_user
from models.user import User
from models.opportunity import Opportunity
from models.notification import Notification
from schemas.user import UserOut
from schemas.opportunity import OpportunityCreate, OpportunityOut
from schemas.notification import NotificationCreate, NotificationOut

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users")
async def list_users(admin: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    out = []
    for u in users:
        auth_method = "Google" if u.google_refresh_token or u.google_access_token else "Email"
        out.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "is_admin": u.is_admin,
            "auth_method": auth_method,
            "created_at": u.created_at
        })
    return out

@router.post("/opportunities", response_model=OpportunityOut)
async def create_opportunity(
    body: OpportunityCreate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    opp = Opportunity(
        title=body.title,
        provider=body.provider,
        description=body.description,
        funding=body.funding,
        location=body.location,
        deadline=body.deadline,
        fields=",".join(body.fields),
        badgeColor=body.badgeColor,
        link=body.link
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    
    return OpportunityOut(
        id=opp.id,
        title=opp.title,
        provider=opp.provider,
        description=opp.description,
        funding=opp.funding,
        location=opp.location,
        deadline=opp.deadline,
        fields=opp.fields.split(",") if opp.fields else [],
        badgeColor=opp.badgeColor,
        link=opp.link,
        created_at=opp.created_at
    )

@router.delete("/opportunities/{opp_id}")
async def delete_opportunity(
    opp_id: str,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Opportunity).where(Opportunity.id == opp_id))
    opp = result.scalar_one_or_none()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    await db.delete(opp)
    await db.commit()
    return {"status": "deleted"}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Prevent admin from deleting themselves
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user_to_delete = result.scalar_one_or_none()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user_to_delete)
    await db.commit()
    return {"status": "deleted"}

@router.post("/notifications", response_model=NotificationOut)
async def create_notification(
    body: NotificationCreate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify user exists if user_id is provided
    if body.user_id:
        result = await db.execute(select(User).where(User.id == body.user_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="User not found")
            
    notif = Notification(
        user_id=body.user_id,
        title=body.title,
        message=body.message,
        type=body.type
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif

@router.get("/notifications")
async def list_notifications(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Notification).order_by(Notification.created_at.desc()))
    return result.scalars().all()

@router.delete("/notifications/{notif_id}")
async def delete_notification(
    notif_id: str,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Notification).where(Notification.id == notif_id))
    notif = result.scalar_one_or_none()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    await db.delete(notif)
    await db.commit()
    return {"status": "deleted"}
