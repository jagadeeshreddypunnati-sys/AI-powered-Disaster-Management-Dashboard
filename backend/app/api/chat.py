"""RescueBot AI Chat API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Victim, Shelter, DisasterZone, ChatMessage
from app.schemas.schemas import ChatRequest, ChatResponse
from app.ai.chatbot import get_rescue_bot_response
import json
import uuid

router = APIRouter()

def _build_app_data(db: Session) -> dict:
    shelters = db.query(Shelter).all()
    victims  = db.query(Victim).all()
    zones    = db.query(DisasterZone).filter(DisasterZone.is_active == True).all()

    total_cap = sum(s.total_capacity for s in shelters)
    total_occ = sum(s.current_occupancy for s in shelters)

    shelter_dicts = [{
        "shelter_id": s.shelter_id, "name": s.name, "address": s.address,
        "total_capacity": s.total_capacity, "current_occupancy": s.current_occupancy,
        "available_capacity": max(0, s.total_capacity - s.current_occupancy),
        "occupancy_pct": round(s.current_occupancy / max(s.total_capacity, 1) * 100, 1),
        "has_medical": s.has_medical, "is_accessible": s.is_accessible,
        "has_food": s.has_food, "has_water": s.has_water, "has_power": s.has_power,
        "risk_score": s.risk_score,
        "status": s.status.value if hasattr(s.status, 'value') else str(s.status),
        "latitude": s.latitude, "longitude": s.longitude,
    } for s in shelters]

    victim_dicts = [{
        "victim_id": v.victim_id, "representative_name": v.representative_name,
        "family_size": v.family_size, "current_location": v.current_location,
        "medical_conditions": v.medical_conditions, "has_disability": v.has_disability,
        "priority": v.priority.value if hasattr(v.priority, 'value') else str(v.priority),
        "is_allocated": v.is_allocated,
    } for v in victims]

    zone_dicts = [{
        "name": z.name,
        "disaster_type": z.disaster_type.value if hasattr(z.disaster_type, 'value') else str(z.disaster_type),
        "risk_level": z.risk_level.value if hasattr(z.risk_level, 'value') else str(z.risk_level),
        "affected_population": z.affected_population, "description": z.description,
        "latitude": z.latitude, "longitude": z.longitude,
    } for z in zones]

    return {
        "shelters": shelter_dicts,
        "victims": victim_dicts,
        "disaster_zones": zone_dicts,
        "stats": {
            "total_affected": sum(z.affected_population for z in zones),
            "registered_victims": len(victims),
            "active_shelters": sum(1 for s in shelters if s.status.value == "operational"),
            "total_capacity": total_cap,
            "available_spaces": total_cap - total_occ,
            "occupancy_pct": round(total_occ / max(total_cap, 1) * 100, 1),
            "high_risk_zones": sum(1 for z in zones if z.risk_level.value in ("high", "critical")),
            "successful_allocations": sum(1 for v in victims if v.is_allocated),
            "pending_allocations": sum(1 for v in victims if not v.is_allocated),
        }
    }

@router.post("/message", response_model=dict)
async def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    app_data = _build_app_data(db)
    result = await get_rescue_bot_response(
        message=payload.message,
        history=payload.history or [],
        app_data=app_data,
    )

    # Persist messages
    db.add(ChatMessage(session_id=payload.session_id, role="user", content=payload.message))
    db.add(ChatMessage(
        session_id=payload.session_id, role="assistant",
        content=result["reply"],
        sources=json.dumps(result.get("sources", []))
    ))
    db.commit()

    return result

@router.get("/history/{session_id}")
def chat_history(session_id: str, db: Session = Depends(get_db)):
    msgs = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.timestamp).all()
    return [{
        "role": m.role, "content": m.content,
        "sources": json.loads(m.sources) if m.sources else [],
        "timestamp": m.timestamp.isoformat()
    } for m in msgs]

@router.get("/context")
def get_context(db: Session = Depends(get_db)):
    """Return structured app context for frontend display"""
    return _build_app_data(db)

@router.get("/suggested-prompts")
def suggested_prompts():
    return {"prompts": [
        "Find the safest available shelter for 100 people",
        "Which shelters have medical facilities?",
        "Show me the highest-risk shelters",
        "What is the current system overview?",
        "Which shelters are overcrowded?",
        "Compare the CSP and Bayesian approaches",
        "List all active disaster zones",
        "How does the allocation algorithm work?",
    ]}
