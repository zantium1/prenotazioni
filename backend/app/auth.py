from uuid import UUID
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session
from .database import get_db, settings

bearer = HTTPBearer()

def current_operator(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    # Validate the access token with Supabase Auth. Do not trust client-provided roles.
    try:
        with httpx.Client(timeout=8) as client:
            response = client.get(
                f"{settings().supabase_url.rstrip('/')}/auth/v1/user",
                headers={"apikey": settings().supabase_publishable_key,
                         "Authorization": f"Bearer {credentials.credentials}"})
        if response.status_code != 200:
            raise HTTPException(401, "Sessione non valida")
        user_id = str(UUID(response.json()["id"]))
    except (httpx.RequestError, ValueError, KeyError):
        raise HTTPException(401, "Impossibile verificare la sessione")
    operator = db.execute(text(
        "select role from public.app_users where id = :id and active = true"
    ), {"id": user_id}).mappings().first()
    if not operator:
        raise HTTPException(403, "Utente non autorizzato per questo albergo")
    return {"id": user_id, "role": operator["role"]}

def require_reception(operator=Depends(current_operator)):
    if operator["role"] not in ("admin", "reception"):
        raise HTTPException(403, "Permessi insufficienti")
    return operator
