from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongodb import init_db
from app.api.router import api_router

# DB init
try:
    init_db()
    print("MongoDB connection established and indexes initialized successfully.")
except Exception as e:
    print("WARNING: MongoDB connection failed.")
    print(f"Error: {str(e)}")

app = FastAPI(
    title="AI Health Companion API",
    description="Backend API for Auth, Reports, Tracking, Chat",
    version="1.0.0",
)

# CORS — the API authenticates via Bearer tokens (not cookies), so credentials
# are not needed. `allow_origins=["*"]` with `allow_credentials=True` is an
# invalid combination per the CORS spec, so credentials are disabled here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes (all under /api)
app.include_router(api_router)
