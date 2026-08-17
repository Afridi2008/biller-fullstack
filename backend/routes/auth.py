from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..auth_service import authenticate_user, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    emailOrUsername: str
    password: str


@router.post("/login")
def login(payload: LoginRequest):

    user = authenticate_user(
        payload.emailOrUsername.strip(),
        payload.password
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username/email or password"
        )

    token = create_access_token(str(user["_id"]))

    return {
        "status": "ok",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "username": user.get("username", ""),
            "role": user.get("role", "Store Manager"),
            "avatarUrl": user.get("avatarUrl", "")
        }
    }


@router.post("/logout")
def logout():
    return {
        "status": "ok",
        "message": "Logged out successfully"
    }
