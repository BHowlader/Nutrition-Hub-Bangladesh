from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import auth, orders, products
from app.core.config import settings
from app.core.database import Base, engine
from app.models import catalog, order, user  # noqa: F401

app = FastAPI(title="Nutrition Hub Bangladesh API", version="0.1.0")

origins = [origin.strip() for origin in settings.backend_cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(auth.router, prefix="/api")

import os
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")
