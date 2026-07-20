"""
main.py — FastAPI entry point.

Run locally with:  uvicorn app.main:app --reload --port 8000
This file just wires together the 5 module routers. Each module lives
in its own file under app/routes/ so team members don't step on each
other's code / merge-conflict constantly.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import sentinel, netra, jaal, drishti, kavach

app = FastAPI(title="RAKSHA AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sentinel.router)
app.include_router(netra.router)
app.include_router(jaal.router)
app.include_router(drishti.router)
app.include_router(kavach.router)


@app.get("/")
def root():
    return {"service": "RAKSHA AI", "status": "ok", "modules": ["sentinel", "netra", "jaal", "drishti", "kavach"]}


@app.get("/api/v1/dashboard/stats")
def dashboard_stats():
    """Unified stats endpoint the frontend home page reads on load."""
    return {
        "success": True,
        "data": {
            "scam_sessions_analysed": 214,
            "high_risk_alerts": 18,
            "counterfeit_notes_flagged": 9,
            "active_fraud_clusters": 3,
            "citizens_assisted": 431,
        },
    }
