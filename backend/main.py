"""
RESCUE AI – FastAPI Main Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import victims, shelters, allocation, agents, chat, analytics, auth, maps
from app.data.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown

app = FastAPI(
    title="RESCUE AI API",
    description="AI-Based Disaster Shelter Allocation and Emergency Response System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router,       prefix="/api/auth",       tags=["Authentication"])
app.include_router(victims.router,    prefix="/api/victims",    tags=["Victims"])
app.include_router(shelters.router,   prefix="/api/shelters",   tags=["Shelters"])
app.include_router(allocation.router, prefix="/api/allocation", tags=["Allocation Engine"])
app.include_router(agents.router,     prefix="/api/agents",     tags=["Multi-Agent"])
app.include_router(chat.router,       prefix="/api/chat",       tags=["RescueBot AI"])
app.include_router(analytics.router,  prefix="/api/analytics",  tags=["Analytics"])
app.include_router(maps.router,       prefix="/api/maps",       tags=["Maps"])

@app.get("/")
def root():
    return {"message": "RESCUE AI API is running", "docs": "/docs", "status": "operational"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "version": "1.0.0"}
