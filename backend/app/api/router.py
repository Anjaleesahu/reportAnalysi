from fastapi import APIRouter

from app.api.routes import auth, reports, tracking, chat

api_router = APIRouter(prefix="/api")


@api_router.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["Tracking"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
