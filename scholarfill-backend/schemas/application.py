from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any, List


class FormField(BaseModel):
    name: str
    label: str
    type: str
    required: bool = False
    options: List[str] = []
    placeholder: str = ""


class ApplicationOut(BaseModel):
    id: str
    form_url: str
    form_title: Optional[str]
    status: str
    form_fields: Optional[Any]
    filled_data: Optional[Any]
    error_message: Optional[str]
    created_at: datetime
    submitted_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ApplicationCreate(BaseModel):
    form_url: str


class ApplicationUpdate(BaseModel):
    filled_data: Any
