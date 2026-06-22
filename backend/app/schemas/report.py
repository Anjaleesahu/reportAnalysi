from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class LabValueBase(BaseModel):
    test_name: str
    value: float
    unit: str
    status: str
    reference_range: Optional[str] = None
    tested_at: datetime


class LabValueCreate(LabValueBase):
    pass


class LabValueResponse(LabValueBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: Optional[int] = None


class MedicalReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    summary: Optional[str] = None
    created_at: datetime


class MedicalReportDetail(MedicalReportResponse):
    model_config = ConfigDict(from_attributes=True)

    extracted_text: Optional[str] = None
    lab_values: List[LabValueResponse] = []
