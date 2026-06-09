from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    title: str
    message: str
    type: str = "info"

class NotificationOut(BaseModel):
    id: str
    user_id: Optional[str]
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
