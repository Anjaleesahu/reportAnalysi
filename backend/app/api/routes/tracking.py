from typing import List

from fastapi import APIRouter, Depends

from app.schemas.tracking import DailyTrackCreate, DailyTrackResponse, MonthlySummaryResponse
from app.services import tracking_service
from app.api.deps import get_current_user

router = APIRouter(tags=["Health Tracking"])


@router.post("/log", response_model=DailyTrackResponse)
def log_daily_tracker(track_in: DailyTrackCreate, current_user: dict = Depends(get_current_user)):
    return tracking_service.log_daily(current_user["_id"], track_in)


@router.get("/history", response_model=List[DailyTrackResponse])
def get_tracking_history(days: int = 30, current_user: dict = Depends(get_current_user)):
    return tracking_service.get_history(current_user["_id"], days)


@router.get("/summary", response_model=MonthlySummaryResponse)
def get_monthly_summary(current_user: dict = Depends(get_current_user)):
    return tracking_service.get_monthly_summary(current_user)
