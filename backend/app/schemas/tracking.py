from datetime import date, datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class DailyTrackCreate(BaseModel):
    date: date
    sleep_hours: float = Field(..., ge=0, le=24)
    water_ml: int = Field(..., ge=0)
    symptoms: List[str] = []  # array of strings; stored comma-separated in DB


class DailyTrackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    sleep_hours: float
    water_ml: int
    symptoms: str  # comma-separated in DB
    created_at: datetime


class MonthlySummaryResponse(BaseModel):
    sleep_average: float
    water_average: float
    logged_days: int
    frequent_symptoms: List[str]
    alerts: List[str]
