"""
routes/drishti.py — Module owner: whoever is building GEOSPATIAL CRIME INTELLIGENCE

Full spec (plan Section 9) calls for Mapbox + HDBSCAN + Prophet forecasting
on live complaint data. For the prototype we generate realistic seeded
incident data around a few Indian cities (again, matching the plan's own
"Demo Data Preparation" section 20.2: "500+ geotagged incidents across
Mumbai, Delhi, Bangalore").

Frontend renders this as markers/heatmap. If you have a free Mapbox
token, drop it into frontend/.env.local as
NEXT_PUBLIC_MAPBOX_TOKEN and the map component will use real Mapbox
tiles; without it, the page falls back to a simple list/table view so
the demo still works with zero external map dependency.
"""
import random
from fastapi import APIRouter

router = APIRouter(prefix="/api/drishti", tags=["drishti"])
random.seed(7)

CITIES = {
    "Mumbai": (19.076, 72.877),
    "Delhi": (28.613, 77.209),
    "Bangalore": (12.971, 77.594),
}


def _generate_incidents():
    incidents = []
    for i in range(60):
        city, (lat, lng) = random.choice(list(CITIES.items()))
        incidents.append({
            "id": f"inc-{i:03d}",
            "type": random.choice(["digital_arrest_scam", "counterfeit_note", "upi_fraud", "kyc_scam"]),
            "city": city,
            "lat": round(lat + random.uniform(-0.08, 0.08), 4),
            "lng": round(lng + random.uniform(-0.08, 0.08), 4),
            "severity": random.choice(["low", "medium", "high"]),
        })
    return incidents


_INCIDENTS = _generate_incidents()


@router.get("/incidents")
def incidents(city: str | None = None):
    data = [i for i in _INCIDENTS if city is None or i["city"] == city]
    return {"success": True, "data": data}


@router.get("/hotspots")
def hotspots():
    return {
        "success": True,
        "data": [
            {"city": "Mumbai", "centroid": CITIES["Mumbai"], "incident_count": 22, "trend": "rising"},
            {"city": "Delhi", "centroid": CITIES["Delhi"], "incident_count": 19, "trend": "stable"},
            {"city": "Bangalore", "centroid": CITIES["Bangalore"], "incident_count": 19, "trend": "rising"},
        ],
    }
