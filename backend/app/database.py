from functools import lru_cache
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    api_token: str
    cors_origins: str = "http://localhost:5173"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache
def settings() -> Settings:
    return Settings()

class Base(DeclarativeBase):
    pass

@lru_cache
def session_factory():
    engine = create_engine(settings().database_url, pool_pre_ping=True)
    return sessionmaker(bind=engine, expire_on_commit=False)

def get_db():
    with session_factory()() as db:
        yield db
