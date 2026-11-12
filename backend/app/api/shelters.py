"""Shelters CRUD API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Shelter, ShelterStatus
from app.schemas.schemas import ShelterCreate, ShelterUpdate

router = APIRouter()

@router.get("/", response_model=List[dict])
def list_shelters(
    skip: int = 0, limit: int = 100,
    status: Optional[str] = None,
    has_medical: Optional[bool] = None,
    is_accessible: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Shelter)
    if status: q = q.filter(Shelter.status == status)
    if has_medical is not None: q = q.filter(Shelter.has_medical == has_medical)
    if is_accessible is not None: q = q.filter(Shelter.is_accessible == is_accessible)
    if search:
        q = q.filter(
            Shelter.name.ilike(f"%{search}%") |
            Shelter.shelter_id.ilike(f"%{search}%") |
            Shelter.address.ilike(f"%{search}%")
        )
    shelters = q.order_by(Shelter.risk_score).offset(skip).limit(limit).all()
    return [_shelter_dict(s) for s in shelters]

@router.post("/", response_model=dict, status_code=201)
def create_shelter(payload: ShelterCreate, db: Session = Depends(get_db)):
    if db.query(Shelter).filter(Shelter.shelter_id == payload.shelter_id).first():
        raise HTTPException(400, f"Shelter ID {payload.shelter_id} already exists")
    if payload.current_occupancy > payload.total_capacity:
        raise HTTPException(400, "Occupancy cannot exceed capacity")
    s = Shelter(**payload.dict())
    db.add(s); db.commit(); db.refresh(s)
    return _shelter_dict(s)

@router.get("/map/data")
def map_data(db: Session = Depends(get_db)):
    """All shelters + disaster zones for map display"""
    from app.models.models import DisasterZone
    shelters = db.query(Shelter).all()
    zones = db.query(DisasterZone).filter(DisasterZone.is_active == True).all()
    return {
        "shelters": [_shelter_dict(s) for s in shelters],
        "disaster_zones": [_zone_dict(z) for z in zones],
    }

@router.get("/{shelter_id}", response_model=dict)
def get_shelter(shelter_id: int, db: Session = Depends(get_db)):
    s = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not s: raise HTTPException(404, "Shelter not found")
    return _shelter_dict(s)

@router.put("/{shelter_id}", response_model=dict)
def update_shelter(shelter_id: int, payload: ShelterUpdate, db: Session = Depends(get_db)):
    s = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not s: raise HTTPException(404, "Shelter not found")
    updates = payload.dict(exclude_none=True)
    cap = updates.get("total_capacity", s.total_capacity)
    occ = updates.get("current_occupancy", s.current_occupancy)
    if occ > cap:
        raise HTTPException(400, "Occupancy cannot exceed capacity")
    for field, value in updates.items():
        setattr(s, field, value)
    db.commit(); db.refresh(s)
    return _shelter_dict(s)

@router.delete("/{shelter_id}")
def delete_shelter(shelter_id: int, db: Session = Depends(get_db)):
    s = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not s: raise HTTPException(404, "Shelter not found")
    db.delete(s); db.commit()
    return {"message": f"Shelter {shelter_id} deleted"}

@router.get("/stats/summary")
def shelter_stats(db: Session = Depends(get_db)):
    shelters = db.query(Shelter).all()
    total_cap = sum(s.total_capacity for s in shelters)
    total_occ = sum(s.current_occupancy for s in shelters)
    return {
        "total": len(shelters),
        "operational": sum(1 for s in shelters if s.status == ShelterStatus.OPERATIONAL),
        "total_capacity": total_cap,
        "total_occupancy": total_occ,
        "available": total_cap - total_occ,
        "occupancy_pct": round(total_occ / max(total_cap, 1) * 100, 1),
        "medical_count": sum(1 for s in shelters if s.has_medical),
    }

def _shelter_dict(s: Shelter) -> dict:
    avail = max(0, s.total_capacity - s.current_occupancy)
    pct = round(s.current_occupancy / max(s.total_capacity, 1) * 100, 1)
    return {
        "id": s.id, "shelter_id": s.shelter_id, "name": s.name, "address": s.address,
        "latitude": s.latitude, "longitude": s.longitude,
        "total_capacity": s.total_capacity, "current_occupancy": s.current_occupancy,
        "available_capacity": avail, "occupancy_pct": pct,
        "has_medical": s.has_medical, "has_food": s.has_food, "has_water": s.has_water,
        "has_sanitation": s.has_sanitation, "is_accessible": s.is_accessible,
        "has_power": s.has_power, "has_communication": s.has_communication,
        "risk_score": s.risk_score,
        "status": s.status.value if hasattr(s.status, 'value') else s.status,
        "contact_name": s.contact_name, "contact_phone": s.contact_phone, "notes": s.notes,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }

def _zone_dict(z) -> dict:
    return {
        "id": z.id, "name": z.name,
        "disaster_type": z.disaster_type.value if hasattr(z.disaster_type, 'value') else z.disaster_type,
        "latitude": z.latitude, "longitude": z.longitude, "radius_km": z.radius_km,
        "risk_level": z.risk_level.value if hasattr(z.risk_level, 'value') else z.risk_level,
        "affected_population": z.affected_population, "description": z.description,
        "reported_at": z.reported_at.isoformat() if z.reported_at else None,
    }
