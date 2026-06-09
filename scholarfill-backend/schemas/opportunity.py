from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OpportunityCreate(BaseModel):
    title: str
    provider: str
    description: str
    funding: str
    location: str
    deadline: str
    fields: List[str]
    badgeColor: str
    link: Optional[str] = None

class OpportunityOut(BaseModel):
    id: str
    title: str
    provider: str
    description: str
    funding: str
    location: str
    deadline: str
    fields: List[str]
    badgeColor: str
    link: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
