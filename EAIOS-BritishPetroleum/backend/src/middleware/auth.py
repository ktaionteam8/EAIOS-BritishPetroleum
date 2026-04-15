"""JWT authentication middleware for EAIOS-BP.

Usage in any FastAPI router:
    from src.middleware.auth import get_current_user

    @router.get("/resource")
    async def read_resource(
        db: AsyncSession = Depends(get_db),
        _: dict = Depends(get_current_user),
    ):
        ...
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.config import settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)

# JWT settings
_ALGORITHM = "HS256"
_EXPIRE_HOURS = 8


def create_access_token(sub: str) -> str:
    """Create a signed JWT for the given subject (username)."""
    payload = {
        "sub": sub,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on any failure."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as exc:
        logger.warning("Invalid JWT received: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> dict:
    """FastAPI dependency — validates Bearer JWT and returns the decoded payload.

    Returns a dict with at least ``{"sub": "<username>"}``.
    When no token is provided the request is treated as a guest (public access).
    """
    if credentials is None:
        return {"sub": "guest"}
    return decode_token(credentials.credentials)
