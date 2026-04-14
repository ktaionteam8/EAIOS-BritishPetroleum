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
from fastapi import APIRouter, Form, HTTPException, Request, status
from pydantic import BaseModel

from src.config import settings
from src.middleware.auth import create_access_token
from src.middleware.rate_limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Pre-computed dummy hash — used for constant-time rejection of unknown usernames.
# Computing once at startup avoids per-request bcrypt cost that could enable DoS.
_DUMMY_HASH: bytes = bcrypt.hashpw(b"dummy", bcrypt.gensalt())

# Startup misconfiguration guard — warn if no users are configured.
try:
    _parsed_users = json.loads(getattr(settings, "auth_users", "{}"))
    if not _parsed_users:
        logger.warning(
            "AUTH_USERS is empty or not set. No users will be able to log in. "
            "Set AUTH_USERS='{\"admin\": \"<bcrypt_hash>\"}' in the environment."
        )
except (json.JSONDecodeError, Exception):
    pass  # _load_users() handles this at request time with a clearer error


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
@limiter.limit("5/minute")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
) -> TokenResponse:
    """Authenticate with username + password and return a JWT access token."""
    users = _load_users()

    stored_hash = users.get(username)
    if not stored_hash:
        # Constant-time rejection to prevent username enumeration
        bcrypt.checkpw(b"dummy", _DUMMY_HASH)
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


@router.get("/health")
async def auth_health():
    """Public health-check — confirms the auth router is reachable.

    NOTE: This endpoint is intentionally unauthenticated. It does not return
    user data. Use POST /api/auth/token to obtain a JWT, then call a
    protected endpoint to confirm authenticated access.
    """
    return {"status": "auth service online"}
