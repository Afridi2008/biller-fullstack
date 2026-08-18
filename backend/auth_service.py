import os
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from .database import db_manager


JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "development-secret-change-this"
)

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt.

    bcrypt supports a maximum of 72 bytes.
    """
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError(
            "Password cannot be longer than 72 bytes."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a plain password against a bcrypt hash.
    """

    try:
        password_bytes = plain_password.encode("utf-8")

        if len(password_bytes) > 72:
            return False

        return bcrypt.checkpw(
            password_bytes,
            hashed_password.encode("utf-8")
        )

    except (ValueError, TypeError):
        return False


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