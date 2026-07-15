from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models  # noqa: ensures models are registered

from routes import auth_routes, session_routes, ai_routes, report_routes, chat_routes

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RehabSense API",
    description="AI-powered rehabilitation monitoring backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(session_routes.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["AI"])
app.include_router(chat_routes.router, prefix="/api/ai", tags=["AI"])
app.include_router(report_routes.router, prefix="/api/report", tags=["Report"])

@app.get("/")
def root():
    return {"message": "RehabSense API is running", "docs": "/docs"}
