import json
import re
from typing import Any, Dict, List

from google import genai
from google.genai import types
from fastapi import HTTPException, status

from app.core.config import settings


def _normalize_test_name(name: str) -> str:
    normalized = name.strip()
    lower = normalized.lower()
    if lower in ("hb", "h b", "haemoglobin", "hemoglobin"):
        return "hemoglobin"
    if "wbc" in lower or "leucocyte" in lower:
        return "wbc"
    if "platelet" in lower:
        return "platelets"
    return normalized


def _parse_value_unit(raw_value: str):
    raw_value = raw_value.strip()
    match = re.match(r"^([0-9]+(?:[\.,][0-9]+)?(?:/\d+)?)(?:\s*(.+?))?$", raw_value)
    if not match:
        return None
    value = match.group(1).replace(",", ".")
    unit = match.group(2).strip() if match.group(2) else None
    return {"value": match.group(1), "value_numeric": value, "unit": unit}


def _parse_lab_table_text(text: str) -> List[Dict[str, Any]]:
    tests: List[Dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if re.search(r"^(test\s*name|result|range|parameter|value)$", line, re.IGNORECASE):
            continue

        parts = re.split(r"\t+|\s{2,}", line)
        if len(parts) < 2:
            continue

        name = parts[0].strip()
        if not name or re.search(r"^test\s*name$", name, re.IGNORECASE):
            continue

        value_field = parts[1].strip()
        reference_range = " ".join(parts[2:]).strip() if len(parts) > 2 else None
        parsed = _parse_value_unit(value_field)
        if not parsed:
            continue

        tests.append({
            "test_name": _normalize_test_name(name),
            "value": parsed["value"],
            "value_numeric": parsed["value_numeric"],
            "unit": parsed["unit"],
            "reference_range": reference_range or None,
        })
    return tests


def get_gemini_client() -> genai.Client:
    """Create a Gemini client using the configured API key."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("YOUR_"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Gemini API Key is not configured. Please add your GEMINI_API_KEY "
                "to the backend .env configuration file."
            )
        )
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def extract_all_tests(text: str) -> Dict[str, Any]:
    """Attempt to extract ALL tests using Gemini; fallback to generic regex."""
    try:
        client = get_gemini_client()
    except HTTPException:
        tests = _parse_lab_table_text(text)
        return {"tests": tests}

    prompt = """
You are a precise data extraction assistant. Analyze the following medical report text and
extract ALL lab/test lines. Do NOT invent or change values. Output strictly JSON with a single
key `tests` which is an array of objects with `name`, `value`, and optional `unit` fields.

Rules:
- Use only values exactly as they appear in the text; do not convert or normalize them.
- If a numeric value appears, capture it as the `value` string. If no unit is present, set unit to null.
- Return an empty list if no tests are found.

Text to analyze:
---
%s
---

Example output:
{"tests": [{"name": "Hemoglobin", "value": "13.5", "unit": "g/dL"}, {"name": "WBC", "value": "6.2", "unit": "x10^9/L"}]}
""" % text

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        extracted = json.loads(response.text)

        if isinstance(extracted, dict) and isinstance(extracted.get("tests"), list):
            return extracted
        tests = _parse_lab_table_text(text)
        return {"tests": tests}
    except Exception:
        tests = _parse_lab_table_text(text)
        return {"tests": tests}


def get_chatbot_response(
    user_message: str,
    chat_history: List[Dict[str, str]],
    lab_history: List[Dict[str, Any]]
) -> str:
    """Gets response from Gemini Chat, passing user lab history as clinical context."""
    client = get_gemini_client()

    history_lines = []
    for lab in lab_history:
        history_lines.append(
            f"- Tested at {lab['tested_at']}: {lab['test_name']} is {lab['value']} {lab['unit']} "
            f"(Status: {lab['status']}, Lab Ref Range: {lab['reference_range'] or 'N/A'})"
        )

    lab_history_context = "\n".join(history_lines) if history_lines else "No lab reports uploaded yet."

    system_instruction = f"""
You are a friendly, professional AI Health Companion.
Your goal is to help users explain their medical lab results, trends, and offer health, diet, and lifestyle advice.

IMPORTANT CONSTRAINTS:
1. ONLY discuss actual values that the user has uploaded. Do NOT fabricate or make up any tests or values.
2. If the user asks about a test result that is not in their records, politely inform them that you don't have that data.
3. Keep advice focused on general health education, diet, exercise, and lifestyle recommendations.
4. NEVER diagnose, prescribe medication, or tell a user to change their prescribed medication doses.
5. ALWAYS add a clear disclaimer at the end stating that you are an AI companion, not a doctor, and they must consult a physician for diagnostic or medical advice.

Here is the user's uploaded lab test history:
{lab_history_context}
"""

    try:
        conversation = system_instruction + "\n\n"

        for msg in chat_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            conversation += f"{role}: {content}\n"

        conversation += f"user: {user_message}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=conversation
        )

        return response.text

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini chat response failed: {str(e)}"
        )
