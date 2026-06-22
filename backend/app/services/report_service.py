import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import HTTPException, status

from app.services.ocr_service import extract_text
from app.services.gemini_service import extract_all_tests
from app.repositories import report_repository, lab_value_repository
from app.db.serializers import serialize_report, serialize_lab_value

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff"}

# Comprehensive reference ranges for all biomarkers
BIOMARKER_REFERENCE_RANGES = {
    # Blood Count - RBC Series
    "hemoglobin": {"range_low": 12.0, "range_high": 17.5, "unit": "g/dL"},
    "haemoglobin": {"range_low": 12.0, "range_high": 17.5, "unit": "g/dL"},
    "r.b.c.": {"range_low": 3.9, "range_high": 5.5, "unit": "milli/cumm"},
    "rbc": {"range_low": 3.9, "range_high": 5.5, "unit": "milli/cumm"},
    "red blood cell": {"range_low": 3.9, "range_high": 5.5, "unit": "milli/cumm"},

    # Blood Count - WBC Series
    "wbc": {"range_low": 4000, "range_high": 10000, "unit": "/cumm"},
    "total leucocyte": {"range_low": 4000, "range_high": 10000, "unit": "/cumm"},
    "white blood cell": {"range_low": 4000, "range_high": 10000, "unit": "/cumm"},
    "neutrophils": {"range_low": 40, "range_high": 70, "unit": "%"},
    "lymphocytes": {"range_low": 20, "range_high": 40, "unit": "%"},
    "monocytes": {"range_low": 2, "range_high": 10, "unit": "%"},
    "eosinophil": {"range_low": 1, "range_high": 5, "unit": "%"},
    "eosinophils": {"range_low": 1, "range_high": 5, "unit": "%"},
    "basophils": {"range_low": 0, "range_high": 1, "unit": "%"},
    "basophil": {"range_low": 0, "range_high": 1, "unit": "%"},

    # Red Blood Cell Indices
    "mcv": {"range_low": 75, "range_high": 96, "unit": "fl"},
    "mean corpuscular volume": {"range_low": 75, "range_high": 96, "unit": "fl"},
    "mch": {"range_low": 27, "range_high": 32, "unit": "pg"},
    "mean corpuscular hemoglobin": {"range_low": 27, "range_high": 32, "unit": "pg"},
    "mchc": {"range_low": 30, "range_high": 36, "unit": "g/dL"},
    "mean corpuscular hb con.": {"range_low": 30, "range_high": 36, "unit": "g/dL"},
    "pcv": {"range_low": 35, "range_high": 45, "unit": "%"},
    "packed cell volume": {"range_low": 35, "range_high": 45, "unit": "%"},
    "hct": {"range_low": 35, "range_high": 45, "unit": "%"},
    "rdw-cv": {"range_low": 11, "range_high": 15, "unit": "%"},
    "rdw-sd": {"range_low": 35, "range_high": 56, "unit": "fl"},

    # Platelet Indices
    "platelet count": {"range_low": 1.5, "range_high": 4.5, "unit": "Lacs/cumm"},
    "platelet": {"range_low": 1.5, "range_high": 4.5, "unit": "Lacs/cumm"},
    "mpv": {"range_low": 6.5, "range_high": 12, "unit": "fl"},
    "mean platelet volume": {"range_low": 6.5, "range_high": 12, "unit": "fl"},
    "pct": {"range_low": 0.108, "range_high": 0.282, "unit": "%"},
    "pdw-cv": {"range_low": 10, "range_high": 17, "unit": "%"},
    "pdw-sd": {"range_low": 9.2, "range_high": 16.7, "unit": "fL"},

    # Other Tests
    "esr": {"range_low": 0, "range_high": 20, "unit": "mm/hr"},
    "erythrocyte sedimentation": {"range_low": 0, "range_high": 20, "unit": "mm/hr"},
    "crp": {"range_low": 0, "range_high": 6, "unit": "mg/L"},
    "c-reactive protein": {"range_low": 0, "range_high": 6, "unit": "mg/L"},

    # Common Metabolic Tests
    "glucose": {"range_low": 70, "range_high": 100, "unit": "mg/dL"},
    "blood sugar": {"range_low": 70, "range_high": 100, "unit": "mg/dL"},
    "cholesterol": {"range_low": 0, "range_high": 200, "unit": "mg/dL"},
    "total cholesterol": {"range_low": 0, "range_high": 200, "unit": "mg/dL"},
}


def classify_lab_value(name: str, value: float) -> Dict[str, str]:
    """Classify biomarker status based on standard medical reference ranges."""
    name_lower = name.lower().strip()

    def _classify(ref_data):
        range_low = ref_data["range_low"]
        range_high = ref_data["range_high"]
        if value < range_low:
            status_val = "Low"
        elif value > range_high:
            status_val = "High"
        else:
            status_val = "Normal"
        return {"status": status_val, "ref_range": f"{range_low} - {range_high}"}

    # Exact match lookup
    if name_lower in BIOMARKER_REFERENCE_RANGES:
        return _classify(BIOMARKER_REFERENCE_RANGES[name_lower])

    # Partial match lookup
    for key, ref_data in BIOMARKER_REFERENCE_RANGES.items():
        if key in name_lower or name_lower in key:
            return _classify(ref_data)

    # Default to Normal if no reference range found
    return {"status": "Normal", "ref_range": "N/A"}


def process_upload(file_bytes: bytes, filename: str, user_id: int) -> Dict[str, Any]:
    """OCR + parse a report, persist it and its lab values, return the report detail."""
    # Validate extension
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and Image files (PNG, JPG, JPEG, BMP, TIFF) are supported."
        )

    # 1. OCR extract text
    extracted_text = extract_text(file_bytes, filename)

    # 2. Extract all available lab tests from the report
    parsed_json = extract_all_tests(extracted_text)
    if not parsed_json.get("tests"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No lab values could be detected in the report. Please ensure the uploaded file "
                "contains legible numeric test values."
            )
        )

    # 3. Build lab value rows in memory (so we never persist an orphan report)
    now = datetime.now(timezone.utc)
    labs_to_create = []
    for item in parsed_json.get("tests", []):
        try:
            val = float(item["value"])
        except (TypeError, ValueError):
            continue

        unit = item.get("unit") or ""
        ref_range = item.get("reference_range") or None
        lab_name = item.get("test_name") or item.get("name") or "Unknown Test"
        classification = classify_lab_value(lab_name, val)

        labs_to_create.append({
            "test_name": lab_name,
            "value": val,
            "unit": unit,
            "status": classification["status"],
            "reference_range": ref_range,
        })

    if not labs_to_create:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No numeric lab values could be saved from the report. "
                "Please check that the report text contains standard numeric values."
            )
        )

    # 4. Save file locally
    safe_filename = f"test_{int(now.timestamp())}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # 5. Persist report + lab values
    report_doc = report_repository.create(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        extracted_text=extracted_text,
        created_at=now,
    )

    created_labs = []
    for lab in labs_to_create:
        created_labs.append(lab_value_repository.create(
            user_id=user_id,
            report_id=report_doc["_id"],
            test_name=lab["test_name"],
            value=lab["value"],
            unit=lab["unit"],
            status=lab["status"],
            reference_range=lab["reference_range"],
            tested_at=now,
        ))

    return serialize_report(
        report_doc,
        [serialize_lab_value(lab) for lab in created_labs],
        detail=True,
    )


def list_reports(user_id: int):
    return [serialize_report(r) for r in report_repository.list_by_user(user_id)]


def get_lab_trends(user_id: int) -> Dict[str, Any]:
    """Group a user's lab values by test name into time-series trends."""
    trends: Dict[str, Any] = {}
    for lab in lab_value_repository.list_by_user(user_id):
        name = lab["test_name"]
        tested_at = lab.get("tested_at")
        trends.setdefault(name, []).append({
            "id": lab["_id"],
            "test_name": name,
            "value": lab["value"],
            "unit": lab.get("unit"),
            "status": lab.get("status"),
            "reference_range": lab.get("reference_range"),
            "tested_at": tested_at.isoformat() if tested_at else None,
            "report_id": lab.get("report_id"),
        })
    return trends


def get_report_detail(report_id: int, user_id: int) -> Dict[str, Any]:
    report = report_repository.get_for_user(report_id, user_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    labs = lab_value_repository.list_by_report(report_id)
    return serialize_report(
        report,
        [serialize_lab_value(lab) for lab in labs],
        detail=True,
    )


def delete_report(report_id: int, user_id: int) -> None:
    report = report_repository.get_for_user(report_id, user_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    file_path = report.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    lab_value_repository.delete_by_report(report_id)
    report_repository.delete(report_id)
