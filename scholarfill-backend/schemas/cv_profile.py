from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class CVProfileOut(BaseModel):
    id: str
    file_name: Optional[str]
    updated_at: datetime
    structured_data: Optional[Any]  # parsed JSON dict

    model_config = {"from_attributes": True}


class CVProfileUpdate(BaseModel):
    structured_data: Any
