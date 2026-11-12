"""Victims CRUD API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Victim, PriorityLevel
from app.schemas.schemas import VictimCreate, VictimUpdate, VictimOut

router = APIRouter()

def auto_classify_priority(victim: Victim) -> PriorityLevel:
    """Auto-assign priority based on vulnerability factors"""
    score = 0
    if victim.medical_conditions: score += 2
    if victim.has_disability: score += 2
    if victim.elderly_count > 0: score += 1
    if victim.children_count > 2: score += 1
    if score >= 4: return PriorityLevel.CRITICAL
    if score >= 2: return PriorityLevel.HIGH
    if score >= 1: return PriorityLevel.MEDIUM
    return PriorityLevel.LOW

@router.get("/", response_model=List[dict])
def list_victims(
    skip: int = 0, limit: int = 100,
    priority: Optional[str] = None,
    is_allocated: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Victim)
    if priority: q = q.filter(Victim.priority == priority)
    if is_allocated is not None: q = q.filter(Victim.is_allocated == is_allocated)
    if search:
        q = q.filter(
            Victim.representative_name.ilike(f"%{search}%") |
            Victim.victim_id.ilike(f"%{search}%") |
            Victim.current_location.ilike(f"%{search}%")
        )
    victims = q.order_by(Victim.registered_at.desc()).offset(skip).limit(limit).all()
    return [_victim_dict(v) for v in victims]

@router.post("/", response_model=dict, status_code=201)
def create_victim(payload: VictimCreate, db: Session = Depends(get_db)):
    if db.query(Victim).filter(Victim.victim_id == payload.victim_id).first():
        raise HTTPException(status_code=400, detail=f"Victim ID {payload.victim_id} already exists")
    v = Victim(**payload.dict())
    # Auto-classify
    if payload.priority == PriorityLevel.MEDIUM:
        v.priority = auto_classify_priority(v)
    db.add(v); db.commit(); db.refresh(v)
    return _victim_dict(v)

@router.get("/{victim_id}", response_model=dict)
def get_victim(victim_id: int, db: Session = Depends(get_db)):
    v = db.query(Victim).filter(Victim.id == victim_id).first()
    if not v: raise HTTPException(404, "Victim not found")
    return _victim_dict(v)

@router.put("/{victim_id}", response_model=dict)
def update_victim(victim_id: int, payload: VictimUpdate, db: Session = Depends(get_db)):
    v = db.query(Victim).filter(Victim.id == victim_id).first()
    if not v: raise HTTPException(404, "Victim not found")
    for field, value in payload.dict(exclude_none=True).items():
        setattr(v, field, value)
    db.commit(); db.refresh(v)
    return _victim_dict(v)

@router.delete("/{victim_id}")
def delete_victim(victim_id: int, db: Session = Depends(get_db)):
    v = db.query(Victim).filter(Victim.id == victim_id).first()
    if not v: raise HTTPException(404, "Victim not found")
    db.delete(v); db.commit()
    return {"message": f"Victim {victim_id} deleted"}

@router.get("/stats/summary")
def victim_stats(db: Session = Depends(get_db)):
    total = db.query(Victim).count()
    allocated = db.query(Victim).filter(Victim.is_allocated == True).count()
    critical = db.query(Victim).filter(Victim.priority == "critical").count()
    medical = db.query(Victim).filter(Victim.medical_conditions != None).count()
    return {
        "total": total, "allocated": allocated,
        "unallocated": total - allocated,
        "critical": critical, "medical_needs": medical
    }

def _victim_dict(v: Victim) -> dict:
    return {
        "id": v.id, "victim_id": v.victim_id,
        "representative_name": v.representative_name,
        "family_size": v.family_size, "current_location": v.current_location,
        "latitude": v.latitude, "longitude": v.longitude,
        "medical_conditions": v.medical_conditions, "has_disability": v.has_disability,
        "mobility_requirements": v.mobility_requirements,
        "children_count": v.children_count, "elderly_count": v.elderly_count,
        "priority": v.priority.value if hasattr(v.priority, 'value') else v.priority,
        "special_requirements": v.special_requirements,
        "is_allocated": v.is_allocated,
        "registered_at": v.registered_at.isoformat() if v.registered_at else None,
    }
