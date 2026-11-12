"""Allocation Engine API endpoints"""
import time
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Victim, Shelter, Allocation
from app.schemas.schemas import AllocationRequest, AllocationResponse
from app.ai.allocation_engine import (
    ShelterState, VictimState,
    CSPAllocationEngine, BacktrackingEngine, BayesianAllocationEngine
)
from app.agents.multi_agent import MultiAgentSystem

router = APIRouter()

def _to_shelter_state(s: Shelter) -> ShelterState:
    return ShelterState(
        id=s.id, shelter_id=s.shelter_id, name=s.name,
        lat=s.latitude, lon=s.longitude,
        total_capacity=s.total_capacity, current_occupancy=s.current_occupancy,
        has_medical=s.has_medical, has_food=s.has_food, has_water=s.has_water,
        has_sanitation=s.has_sanitation, is_accessible=s.is_accessible,
        has_power=s.has_power, risk_score=s.risk_score,
        status=s.status.value if hasattr(s.status, 'value') else s.status,
    )

def _to_victim_state(v: Victim) -> VictimState:
    return VictimState(
        id=v.id, victim_id=v.victim_id, name=v.representative_name,
        family_size=v.family_size, lat=v.latitude, lon=v.longitude,
        has_medical_need=bool(v.medical_conditions),
        has_disability=v.has_disability,
        children_count=v.children_count or 0,
        elderly_count=v.elderly_count or 0,
        priority=v.priority.value if hasattr(v.priority, 'value') else str(v.priority),
    )

@router.post("/run", response_model=dict)
def run_allocation(payload: AllocationRequest, db: Session = Depends(get_db)):
    # Fetch data
    shelters = db.query(Shelter).all()
    victim_query = db.query(Victim).filter(Victim.is_allocated == False)
    if payload.victim_ids:
        victim_query = db.query(Victim).filter(Victim.id.in_(payload.victim_ids))
    victims = victim_query.all()

    if not victims:
        return {"success": True, "message": "No victims to allocate", "results": [], "total_allocated": 0}
    if not shelters:
        raise HTTPException(400, "No shelters available")

    # Apply what-if modifications
    shelter_states = [_to_shelter_state(s) for s in shelters]
    victim_states  = [_to_victim_state(v) for v in victims]
    disaster_severity = 0.5

    if payload.what_if:
        wif = payload.what_if
        # Close a shelter
        if "close_shelter_id" in wif:
            for ss in shelter_states:
                if ss.shelter_id == wif["close_shelter_id"]:
                    ss.status = "closed"
        # Increase disaster severity
        if "disaster_severity" in wif:
            disaster_severity = float(wif["disaster_severity"])
        # Reduce capacity
        if "reduce_capacity_id" in wif and "new_capacity" in wif:
            for ss in shelter_states:
                if ss.shelter_id == wif["reduce_capacity_id"]:
                    ss.total_capacity = int(wif["new_capacity"])

    # Run selected algorithm
    algo = payload.algorithm.lower()
    if algo == "backtracking":
        engine = BacktrackingEngine()
        result = engine.solve(victim_states, shelter_states)
    elif algo == "bayesian":
        engine = BayesianAllocationEngine()
        result = engine.solve(victim_states, shelter_states, disaster_severity)
    elif algo == "multi_agent":
        mas = MultiAgentSystem()
        result = mas.run(victim_states, shelter_states, disaster_severity)
        return result
    else:  # default: csp
        weights = payload.weights or {}
        engine = CSPAllocationEngine(weights if weights else None)
        result = engine.solve(victim_states, shelter_states)

    return result

@router.post("/compare")
def compare_algorithms(
    victim_count: int = 10,
    db: Session = Depends(get_db)
):
    """Run all algorithms on the same dataset and compare"""
    shelters = db.query(Shelter).limit(10).all()
    victims  = db.query(Victim).filter(Victim.is_allocated == False).limit(victim_count).all()
    shelter_states = [_to_shelter_state(s) for s in shelters]
    victim_states  = [_to_victim_state(v) for v in victims]

    comparison = {}
    for name, engine in [
        ("CSP", CSPAllocationEngine()),
        ("Backtracking", BacktrackingEngine()),
        ("Bayesian", BayesianAllocationEngine()),
    ]:
        try:
            if name == "Bayesian":
                r = engine.solve(victim_states, shelter_states)
            else:
                r = engine.solve(victim_states, shelter_states)
            comparison[name] = {
                "total_allocated": r.get("total_allocated", 0),
                "total_unallocated": r.get("total_unallocated", 0),
                "states_explored": r.get("states_explored", 0),
                "execution_time_ms": r.get("execution_time_ms", 0),
                "success": r.get("success", False),
            }
        except Exception as e:
            comparison[name] = {"error": str(e)}

    return {"comparison": comparison, "victim_count": len(victims), "shelter_count": len(shelters)}

@router.post("/approve/{allocation_id}")
def approve_allocation(allocation_id: int, db: Session = Depends(get_db)):
    alloc = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not alloc: raise HTTPException(404, "Allocation not found")
    alloc.is_approved = True
    # Update victim status
    victim = db.query(Victim).filter(Victim.id == alloc.victim_id).first()
    if victim: victim.is_allocated = True
    # Update shelter occupancy
    shelter = db.query(Shelter).filter(Shelter.id == alloc.shelter_id).first()
    if shelter: shelter.current_occupancy += alloc.allocated_people
    db.commit()
    return {"message": "Allocation approved", "allocation_id": allocation_id}

@router.get("/history")
def allocation_history(db: Session = Depends(get_db)):
    allocs = db.query(Allocation).order_by(Allocation.allocated_at.desc()).limit(50).all()
    return [{
        "id": a.id, "victim_id": a.victim_id, "shelter_id": a.shelter_id,
        "allocated_people": a.allocated_people, "algorithm_used": a.algorithm_used,
        "explanation": a.explanation, "risk_score": a.risk_score,
        "is_approved": a.is_approved,
        "allocated_at": a.allocated_at.isoformat() if a.allocated_at else None,
    } for a in allocs]
