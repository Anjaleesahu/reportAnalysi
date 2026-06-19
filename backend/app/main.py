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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes (all under /api)
app.include_router(api_router)
