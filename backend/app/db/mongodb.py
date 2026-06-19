from pymongo import MongoClient, ASCENDING, ReturnDocument

from app.core.config import settings

# MongoDB client / database handle
client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=3000)
db = client[settings.MONGO_DB_NAME]

# Collections
users_collection = db["users"]
reports_collection = db["medical_reports"]
lab_values_collection = db["lab_values"]
daily_tracks_collection = db["daily_tracks"]
counters_collection = db["counters"]


def next_sequence(name: str) -> int:
    """Atomic auto-increment so documents keep integer ids (preserves the API contract)."""
    doc = counters_collection.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc["seq"]


def init_db():
    """Verify the MongoDB connection and create indexes. Raises if unreachable."""
    client.admin.command("ping")

    users_collection.create_index([("email", ASCENDING)], unique=True)
    reports_collection.create_index([("user_id", ASCENDING)])
    lab_values_collection.create_index([("user_id", ASCENDING)])
    lab_values_collection.create_index([("report_id", ASCENDING)])
    daily_tracks_collection.create_index(
        [("user_id", ASCENDING), ("date", ASCENDING)],
        unique=True,
        name="uq_user_date",
    )


def get_db():
    """FastAPI dependency returning the MongoDB database handle."""
    return db
