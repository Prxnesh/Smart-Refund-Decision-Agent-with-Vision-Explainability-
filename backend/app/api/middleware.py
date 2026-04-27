from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

_ALGORITHM = "HS256"
_TTL_HOURS = 8

security = HTTPBearer(auto_error=False)


def issue_token(username: str, password: str) -> str:
    if username != settings.admin_user or password != settings.admin_pass:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    expires = datetime.now(timezone.utc) + timedelta(hours=_TTL_HOURS)
    return jwt.encode({"sub": username, "exp": expires}, settings.jwt_secret, algorithm=_ALGORITHM)


def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> None:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization token")
    try:
        jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
