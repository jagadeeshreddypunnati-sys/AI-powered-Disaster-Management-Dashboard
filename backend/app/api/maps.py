"""Maps API – Google Maps + Leaflet data"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.models import Shelter, DisasterZone

router = APIRouter()

@router.get("/config")
def map_config():
    """Return map configuration (never expose key to frontend directly)"""
    return {
        "has_google_maps": bool(settings.GOOGLE_MAPS_API_KEY),
        "default_center": {"lat": 13.0827, "lng": 80.2707},  # Chennai
        "default_zoom": 10,
    }

@router.get("/markers")
def map_markers(db: Session = Depends(get_db)):
    """Return all map markers for shelters and disaster zones"""
    shelters = db.query(Shelter).all()
    zones    = db.query(DisasterZone).filter(DisasterZone.is_active == True).all()

    def shelter_color(s) -> str:
        occ_pct = s.current_occupancy / max(s.total_capacity, 1)
        status = s.status.value if hasattr(s.status, 'value') else str(s.status)
        if status in ("closed", "damaged"): return "gray"
        if s.risk_score > 0.7: return "red"
        if occ_pct > 0.85: return "orange"
        if occ_pct > 0.60: return "yellow"
        return "green"

    def zone_color(z) -> str:
        risk = z.risk_level.value if hasattr(z.risk_level, 'value') else str(z.risk_level)
        return {"low": "green", "moderate": "yellow", "high": "orange", "critical": "red"}.get(risk, "gray")

    shelter_markers = [{
        "id": s.id, "type": "shelter",
        "lat": s.latitude, "lng": s.longitude,
        "color": shelter_color(s),
        "title": s.name,
        "data": {
            "shelter_id": s.shelter_id, "name": s.name, "address": s.address,
            "capacity": s.total_capacity, "occupancy": s.current_occupancy,
            "available": max(0, s.total_capacity - s.current_occupancy),
            "has_medical": s.has_medical, "is_accessible": s.is_accessible,
            "risk_score": s.risk_score,
            "status": s.status.value if hasattr(s.status, 'value') else str(s.status),
            "contact": f"{s.contact_name} | {s.contact_phone}",
        }
    } for s in shelters]

    zone_markers = [{
        "id": z.id, "type": "disaster_zone",
        "lat": z.latitude, "lng": z.longitude,
        "color": zone_color(z),
        "radius_km": z.radius_km,
        "title": z.name,
        "data": {
            "name": z.name,
            "disaster_type": z.disaster_type.value if hasattr(z.disaster_type, 'value') else str(z.disaster_type),
            "risk_level": z.risk_level.value if hasattr(z.risk_level, 'value') else str(z.risk_level),
            "affected_population": z.affected_population,
            "description": z.description,
        }
    } for z in zones]

    # Sample evacuation routes (polylines)
    evacuation_routes = [
        {
            "id": "route-1", "name": "Coastal Evacuation Route Alpha",
            "color": "#3B82F6", "weight": 3,
            "points": [
                {"lat": 13.0827, "lng": 80.2707},
                {"lat": 13.0469, "lng": 80.0974},
                {"lat": 13.1143, "lng": 80.0982},
            ]
        },
        {
            "id": "route-2", "name": "Inland Route Bravo",
            "color": "#10B981", "weight": 3,
            "points": [
                {"lat": 12.9990, "lng": 80.2680},
                {"lat": 12.9686, "lng": 80.1529},
                {"lat": 12.9674, "lng": 79.9479},
            ]
        },
    ]

    return {
        "shelter_markers": shelter_markers,
        "disaster_zones": zone_markers,
        "evacuation_routes": evacuation_routes,
    }
