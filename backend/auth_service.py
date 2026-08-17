import os
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from .database import db_manager


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "development-secret-change-this"
)

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


def create_access_token(user_id: str) -> str:

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(hours=24)
    )

    payload = {
        "sub": user_id,
        "exp": expires_at
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


def authenticate_user(
    email_or_username: str,
    password: str
):

    if not db_manager.ensure_connection():
        return None

    users_collection = db_manager.db["users"]

    user = users_collection.find_one({
        "$or": [
            {
                "email": email_or_username
            },
            {
                "username": email_or_username
            }
        ]
    })

    if not user:
        return None

    password_hash = user.get("passwordHash")

    if not password_hash:
        return None

    if not verify_password(
        password,
        password_hash
    ):
        return None

    return user
