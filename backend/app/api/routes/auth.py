from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.schemas.auth import RegisterRequest, Token
from app.services import auth_service
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register")
def register(req: RegisterRequest):
    return auth_service.register_user(req.email, req.password, req.full_name)


@router.post("/login", response_model=Token, summary="User Login")
async def login(request: Request):
    """Accept credentials as either a JSON body (frontend sends {email, password})
    or OAuth2 form-data (Swagger/standard clients send username/password)."""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            data = await request.json()
        except Exception:
            data = {}
        identifier = data.get("username") or data.get("email")
        password = data.get("password")
    else:
        form = await request.form()
        identifier = form.get("username") or form.get("email")
        password = form.get("password")

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Both an email/username and a password are required.",
        )

    return auth_service.authenticate(identifier, password)


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name"),
        "created_at": current_user.get("created_at"),
    }
