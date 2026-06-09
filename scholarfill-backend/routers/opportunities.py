from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.opportunity import Opportunity
from schemas.opportunity import OpportunityOut

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])

@router.get("", response_model=list[OpportunityOut])
async def get_opportunities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Opportunity).order_by(Opportunity.created_at.desc()))
    opportunities = result.scalars().all()
    
    out = []
    for opp in opportunities:
        out.append(OpportunityOut(
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
        ))
    return out
