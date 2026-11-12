"""Multi-Agent API endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Victim, Shelter
from app.agents.multi_agent import MultiAgentSystem
from app.api.allocation import _to_shelter_state, _to_victim_state

router = APIRouter()

@router.post("/run")
def run_agents(
    disaster_severity: float = 0.5,
    victim_limit: int = 20,
    db: Session = Depends(get_db)
):
    shelters = db.query(Shelter).all()
    victims  = db.query(Victim).filter(Victim.is_allocated == False).limit(victim_limit).all()
    shelter_states = [_to_shelter_state(s) for s in shelters]
    victim_states  = [_to_victim_state(v) for v in victims]
    mas = MultiAgentSystem()
    return mas.run(victim_states, shelter_states, disaster_severity)

@router.get("/status")
def agents_status():
    return {
        "agents": [
            {"name": "Location Agent", "status": "ready", "responsibility": "Distance & route evaluation"},
            {"name": "Safety Agent", "status": "ready", "responsibility": "Risk assessment & disaster evaluation"},
            {"name": "Shelter Agent", "status": "ready", "responsibility": "Capacity & facility verification"},
            {"name": "Medical Agent", "status": "ready", "responsibility": "Medical & accessibility prioritization"},
            {"name": "Allocation Agent", "status": "ready", "responsibility": "CSP & optimization algorithms"},
            {"name": "Coordinator Agent", "status": "ready", "responsibility": "Conflict resolution & final plan"},
        ]
    }
