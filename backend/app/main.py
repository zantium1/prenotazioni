from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import current_operator
from .database import settings
from .routes import router

app = FastAPI(title="Prenotazioni API", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().cors_origins.split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(router, dependencies=[Depends(current_operator)])
