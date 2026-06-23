import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import HTTPException, status

from app.services.ocr_service import extract_text
from app.services.gemini_service import extract_all_tests, generate_report_summary
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


# Sex-specific reference ranges (override the unisex table above when the user's
# sex is known). Values are (low, high).
GENDERED_REFERENCE_RANGES = {
    "hemoglobin": {"male": (13.5, 17.5), "female": (12.0, 15.5)},
    "haemoglobin": {"male": (13.5, 17.5), "female": (12.0, 15.5)},
    "rbc": {"male": (4.5, 5.9), "female": (4.0, 5.2)},
    "r.b.c.": {"male": (4.5, 5.9), "female": (4.0, 5.2)},
    "red blood cell": {"male": (4.5, 5.9), "female": (4.0, 5.2)},
    "pcv": {"male": (40, 52), "female": (36, 46)},
    "packed cell volume": {"male": (40, 52), "female": (36, 46)},
    "hct": {"male": (40, 52), "female": (36, 46)},
}


def _status_for(value: float, low: float, high: float) -> Dict[str, str]:
    if value < low:
        status_val = "Low"
    elif value > high:
        status_val = "High"
    else:
        status_val = "Normal"
    return {"status": status_val, "ref_range": f"{low} - {high}"}


def classify_lab_value(name: str, value: float, sex: str = None) -> Dict[str, str]:
    """Classify biomarker status. Uses sex-specific ranges when the user's sex is
    known and the biomarker has them; otherwise the unisex reference table."""
    name_lower = name.lower().strip()

    # 1) Sex-specific ranges take priority when available
    if sex in ("male", "female"):
        for key, by_sex in GENDERED_REFERENCE_RANGES.items():
            if key == name_lower or key in name_lower or name_lower in key:
                low, high = by_sex[sex]
                return _status_for(value, low, high)

    # 2) Exact match in the unisex table
    if name_lower in BIOMARKER_REFERENCE_RANGES:
        ref = BIOMARKER_REFERENCE_RANGES[name_lower]
        return _status_for(value, ref["range_low"], ref["range_high"])

    # 3) Partial match in the unisex table
    for key, ref in BIOMARKER_REFERENCE_RANGES.items():
        if key in name_lower or name_lower in key:
            return _status_for(value, ref["range_low"], ref["range_high"])

    # 4) Unknown biomarker
    return {"status": "Normal", "ref_range": "N/A"}


MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


def process_upload(file_bytes: bytes, filename: str, user: Dict[str, Any]) -> Dict[str, Any]:
    """OCR + parse a report, persist it (with an AI summary) and its lab values,
    classified against the user's sex-specific ranges where available."""
    user_id = user["_id"]
    sex = user.get("sex")

    # Validate extension
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and Image files (PNG, JPG, JPEG, BMP, TIFF) are supported."
        )

    # Guard against oversized uploads (read fully into memory before OCR)
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum upload size is 10 MB.",
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
        classification = classify_lab_value(lab_name, val, sex)

        labs_to_create.append({
            "test_name": lab_name,
            "value": val,
            "unit": unit,
            "status": classification["status"],
            "reference_range": ref_range or classification["ref_range"],
        })

    if not labs_to_create:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No numeric lab values could be saved from the report. "
                "Please check that the report text contains standard numeric values."
            )
        )

    # 4. Generate a plain-language AI summary (degrades gracefully if Gemini is down)
    summary = generate_report_summary(labs_to_create)

    # 5. Save file locally
    safe_filename = f"test_{int(now.timestamp())}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # 6. Persist report + lab values
    report_doc = report_repository.create(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        extracted_text=extracted_text,
        created_at=now,
        summary=summary,
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


def list_reports(user_id: int, skip: int = 0, limit: int = 0):
    return [serialize_report(r) for r in report_repository.list_by_user(user_id, skip, limit)]


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


def add_lab_value(user: Dict[str, Any], report_id: int, test_name: str, value: float, unit: str = "") -> Dict[str, Any]:
    """Manually add a lab value to an owned report (status computed)."""
    user_id = user["_id"]
    report = report_repository.get_for_user(report_id, user_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

    classification = classify_lab_value(test_name, value, user.get("sex"))
    lab = lab_value_repository.create(
        user_id=user_id,
        report_id=report_id,
        test_name=test_name,
        value=value,
        unit=unit or "",
        status=classification["status"],
        reference_range=classification["ref_range"],
        tested_at=report.get("created_at") or datetime.now(timezone.utc),
    )
    return serialize_lab_value(lab)


def update_lab_value(user: Dict[str, Any], lab_id: int, test_name: str, value: float, unit: str = "") -> Dict[str, Any]:
    """Edit an owned lab value; status + reference range are recomputed."""
    user_id = user["_id"]
    lab = lab_value_repository.get_for_user(lab_id, user_id)
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab value not found.")

    classification = classify_lab_value(test_name, value, user.get("sex"))
    updated = lab_value_repository.update(lab_id, {
        "test_name": test_name,
        "value": value,
        "unit": unit or "",
        "status": classification["status"],
        "reference_range": classification["ref_range"],
    })
    return serialize_lab_value(updated)


def delete_lab_value(user_id: int, lab_id: int) -> None:
    lab = lab_value_repository.get_for_user(lab_id, user_id)
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab value not found.")
    lab_value_repository.delete(lab_id)


def get_report_file(report_id: int, user_id: int) -> Dict[str, Any]:
    """Return the stored file path + original filename for an owned report."""
    report = report_repository.get_for_user(report_id, user_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    file_path = report.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original file is no longer available.")
    return {"file_path": file_path, "filename": report.get("filename", "report")}


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
