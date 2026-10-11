import secrets
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from .database import settings
from .routes import router

app = FastAPI(title="Prenotazioni API", version="0.2.0")
bearer = HTTPBearer()

def require_token(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if not secrets.compare_digest(credentials.credentials, settings().api_token):
        raise HTTPException(status_code=401, detail="Credenziali non valide")

@app.get("/health")
def health():
    return {"status": "ok"}

# Temporary single-token server authentication for development only.
# Replace with per-user authentication and role permissions before production.
app.include_router(router, dependencies=[Depends(require_token)])

# No wildcard origins or browser-stored server token.
