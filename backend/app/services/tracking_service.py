from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List

from app.repositories import tracking_repository
from app.db.serializers import serialize_track
from app.schemas.tracking import DailyTrackCreate


def _to_datetime(d: date) -> datetime:
    """MongoDB has no date type, so store calendar dates as midnight datetimes."""
    return datetime(d.year, d.month, d.day)


def log_daily(user_id: int, track_in: DailyTrackCreate) -> Dict[str, Any]:
    symptoms_str = ",".join(track_in.symptoms)
    track_date = _to_datetime(track_in.date)

    existing = tracking_repository.get_by_user_and_date(user_id, track_date)
    if existing:
        updated = tracking_repository.update(existing["_id"], {
            "sleep_hours": track_in.sleep_hours,
            "water_ml": track_in.water_ml,
            "symptoms": symptoms_str,
        })
        return serialize_track(updated)

    created = tracking_repository.create(
        user_id=user_id,
        date_dt=track_date,
        sleep_hours=track_in.sleep_hours,
        water_ml=track_in.water_ml,
        symptoms=symptoms_str,
        created_at=datetime.now(timezone.utc),
    )
    return serialize_track(created)


def get_history(user_id: int, days: int = 30) -> List[Dict[str, Any]]:
    return [serialize_track(t) for t in tracking_repository.list_by_user(user_id, days)]


def get_monthly_summary(user_id: int) -> Dict[str, Any]:
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    tracks = tracking_repository.list_since(user_id, _to_datetime(thirty_days_ago))
    logged_days = len(tracks)

    if logged_days == 0:
        return {
            "sleep_average": 0.0,
            "water_average": 0.0,
            "logged_days": 0,
            "frequent_symptoms": [],
            "alerts": ["No health tracking records found in last 30 days."],
        }

    total_sleep = sum(t.get("sleep_hours", 0) for t in tracks)
    total_water = sum(t.get("water_ml", 0) for t in tracks)

    sleep_average = round(total_sleep / logged_days, 1)
    water_average = round(total_water / logged_days, 0)

    symptom_list = []
    for t in tracks:
        if t.get("symptoms"):
            symptom_list.extend([s.strip() for s in t["symptoms"].split(",") if s.strip()])

    symptom_counts = Counter(symptom_list)
    frequent_symptoms = [s[0] for s in symptom_counts.most_common(3)]

    alerts = []
    if sleep_average < 6:
        alerts.append(f"Low sleep average: {sleep_average} hrs. Try improving sleep routine.")
    elif sleep_average > 9.5:
        alerts.append(f"High sleep average: {sleep_average} hrs. Check fatigue levels.")

    if water_average < 1500:
        alerts.append(f"Low hydration: {int(water_average)} ml daily.")

    for symptom, count in symptom_counts.items():
        if count >= 4:
            alerts.append(f"Frequent symptom '{symptom}' logged {count} times.")

    if not alerts:
        alerts.append("Health tracking looks balanced.")

    return {
        "sleep_average": sleep_average,
        "water_average": water_average,
        "logged_days": logged_days,
        "frequent_symptoms": frequent_symptoms,
        "alerts": alerts,
    }
