from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, status
from fastapi.responses import FileResponse

from app.schemas.report import MedicalReportResponse, MedicalReportDetail, LabValueResponse, LabValueInput
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
def get_reports_history(
    skip: int = 0,
    limit: int = 0,
    current_user: dict = Depends(get_current_user),
):
    return report_service.list_reports(current_user["_id"], skip, limit)


@router.post("/{report_id}/lab-values", response_model=LabValueResponse)
def add_lab_value(report_id: int, lab: LabValueInput, current_user: dict = Depends(get_current_user)):
    return report_service.add_lab_value(current_user, report_id, lab.test_name, lab.value, lab.unit)


@router.put("/lab-values/{lab_id}", response_model=LabValueResponse)
def update_lab_value(lab_id: int, lab: LabValueInput, current_user: dict = Depends(get_current_user)):
    return report_service.update_lab_value(current_user, lab_id, lab.test_name, lab.value, lab.unit)


@router.delete("/lab-values/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab_value(lab_id: int, current_user: dict = Depends(get_current_user)):
    report_service.delete_lab_value(current_user["_id"], lab_id)
    return None


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
