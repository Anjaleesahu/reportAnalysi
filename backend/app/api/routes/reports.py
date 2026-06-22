from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, status
from fastapi.responses import FileResponse

from app.schemas.report import MedicalReportResponse, MedicalReportDetail
from app.services import report_service
from app.api.deps import get_current_user

router = APIRouter(tags=["Medical Reports"])


@router.post("/upload", response_model=MedicalReportDetail)
async def upload_report(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    return report_service.process_upload(file_bytes, file.filename, current_user)


@router.get("/history", response_model=List[MedicalReportResponse])
def get_reports_history(current_user: dict = Depends(get_current_user)):
    return report_service.list_reports(current_user["_id"])


@router.get("/lab-trends")
def get_lab_trends(current_user: dict = Depends(get_current_user)):
    return report_service.get_lab_trends(current_user["_id"])


@router.get("/{report_id}/file")
def download_report_file(report_id: int, current_user: dict = Depends(get_current_user)):
    info = report_service.get_report_file(report_id, current_user["_id"])
    return FileResponse(info["file_path"], filename=info["filename"])


@router.get("/{report_id}", response_model=MedicalReportDetail)
def get_report_detail(report_id: int, current_user: dict = Depends(get_current_user)):
    return report_service.get_report_detail(report_id, current_user["_id"])


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: int, current_user: dict = Depends(get_current_user)):
    report_service.delete_report(report_id, current_user["_id"])
    return None
