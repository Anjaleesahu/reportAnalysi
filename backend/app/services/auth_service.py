from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.repositories import user_repository


def register_user(email: str, password: str, full_name: Optional[str]) -> dict:
    if user_repository.get_by_email(email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    user_repository.create(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        created_at=datetime.now(timezone.utc),
    )
    return {"message": "User created successfully"}


def authenticate(username: str, password: str) -> dict:
    user = user_repository.get_by_email(username)

    # Single generic error for both cases to avoid leaking which emails exist.
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}
