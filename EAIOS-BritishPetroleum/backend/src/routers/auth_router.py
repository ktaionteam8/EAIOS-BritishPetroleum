"""Authentication router — issues JWT access tokens.

POST /api/auth/token
    Form fields: username, password
    Returns: {"access_token": "<jwt>", "token_type": "bearer"}

Users are stored in the AUTH_USERS environment variable as JSON:
    AUTH_USERS='{"admin": "<bcrypt_hash>", "trader": "<bcrypt_hash>"}'

Generate a password hash:
    python -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"
"""
import json
import logging

import bcrypt
from fastapi import APIRouter, Form, HTTPException, status
from pydantic import BaseModel

from src.config import settings
from src.middleware.auth import create_access_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _load_users() -> dict[str, str]:
    """Load username→bcrypt_hash mapping from AUTH_USERS env var."""
    raw = getattr(settings, "auth_users", "{}")
    try:
        users = json.loads(raw)
        if not isinstance(users, dict):
            raise ValueError("AUTH_USERS must be a JSON object")
        return users
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Invalid AUTH_USERS configuration: %s", exc)
        return {}


@router.post("/token", response_model=TokenResponse)
async def login(
    username: str = Form(...),
    password: str = Form(...),
) -> TokenResponse:
    """Authenticate with username + password and return a JWT access token."""
    users = _load_users()

    stored_hash = users.get(username)
    if not stored_hash:
        # Constant-time rejection to prevent username enumeration
        bcrypt.checkpw(b"dummy", bcrypt.hashpw(b"dummy", bcrypt.gensalt()))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        valid = bcrypt.checkpw(password.encode(), stored_hash.encode())
    except Exception:
        valid = False

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(sub=username)
    return TokenResponse(access_token=token)


@router.get("/me")
async def whoami(username: str = ""):
    """Public endpoint — confirms the auth router is reachable."""
    return {"status": "auth service online"}
