"""Analytics and Reports API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Victim, Shelter, DisasterZone, Allocation, ShelterStatus

router = APIRouter()

@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db)):
    victims  = db.query(Victim).all()
    shelters = db.query(Shelter).all()
    zones    = db.query(DisasterZone).filter(DisasterZone.is_active == True).all()

    total_cap = sum(s.total_capacity for s in shelters)
    total_occ = sum(s.current_occupancy for s in shelters)
    op_shelters = [s for s in shelters if s.status == ShelterStatus.OPERATIONAL]

    # Shelter capacity chart data
    capacity_chart = [
        {
            "name": s.shelter_id,
            "total": s.total_capacity,
            "occupied": s.current_occupancy,
            "available": max(0, s.total_capacity - s.current_occupancy),
            "pct": round(s.current_occupancy / max(s.total_capacity, 1) * 100, 1)
        }
        for s in op_shelters[:8]
    ]

    # Priority distribution
    priority_dist = {}
    for v in victims:
        p = v.priority.value if hasattr(v.priority, 'value') else str(v.priority)
        priority_dist[p] = priority_dist.get(p, 0) + 1

    # Risk distribution for zones
    risk_dist = {}
    for z in zones:
        r = z.risk_level.value if hasattr(z.risk_level, 'value') else str(z.risk_level)
        risk_dist[r] = risk_dist.get(r, 0) + 1

    # Allocation status
    allocated = sum(1 for v in victims if v.is_allocated)
    unallocated = len(victims) - allocated

    # Recent activities (simulated)
    recent_activities = [
        {"time": "2 min ago", "action": "CSP Allocation Run", "details": "12 victims allocated to 4 shelters", "type": "allocation"},
        {"time": "15 min ago", "action": "Shelter S-06 Updated", "details": "Capacity increased to 2000", "type": "shelter"},
        {"time": "32 min ago", "action": "New Victims Registered", "details": "15 family groups from Besant Nagar", "type": "victim"},
        {"time": "1 hr ago", "action": "Disaster Alert", "details": "Cyclone warning upgraded to Category 4", "type": "alert"},
        {"time": "2 hrs ago", "action": "Agent Coordination", "details": "Multi-agent plan executed successfully", "type": "agent"},
    ]

    alerts = [
        {"level": "critical", "message": "Cyclone Category 4 approaching — 25,000 people at risk", "zone": "Bay of Bengal"},
        {"level": "high", "message": "S-02 Shelter nearing full capacity (96%)", "shelter": "S-02"},
        {"level": "warning", "message": "12 high-priority victims still unallocated", "count": 12},
    ]

    ai_recommendations = [
        {"algorithm": "CSP", "recommendation": "Allocate V-003, V-007, V-010 to S-06 immediately (medical + capacity)", "confidence": 0.94},
        {"algorithm": "Bayesian", "recommendation": "S-08 risk probability critical (0.95) — evacuate nearby residents", "confidence": 0.91},
        {"algorithm": "Multi-Agent", "recommendation": "Coordinated plan ready: 47 victims → 4 shelters, 2 conflicts resolved", "confidence": 0.88},
    ]

    return {
        "stats": {
            "total_affected": sum(z.affected_population for z in zones),
            "registered_victims": len(victims),
            "active_shelters": len(op_shelters),
            "total_capacity": total_cap,
            "available_spaces": total_cap - total_occ,
            "occupancy_pct": round(total_occ / max(total_cap, 1) * 100, 1),
            "high_risk_zones": sum(1 for z in zones if z.risk_level.value in ("high", "critical")),
            "pending_allocations": unallocated,
            "successful_allocations": allocated,
        },
        "capacity_chart": capacity_chart,
        "priority_distribution": [{"name": k, "value": v} for k, v in priority_dist.items()],
        "risk_distribution": [{"name": k, "value": v} for k, v in risk_dist.items()],
        "allocation_summary": {"allocated": allocated, "unallocated": unallocated},
        "recent_activities": recent_activities,
        "alerts": alerts,
        "ai_recommendations": ai_recommendations,
        "disaster_zones": [
            {
                "name": z.name,
                "type": z.disaster_type.value if hasattr(z.disaster_type, 'value') else str(z.disaster_type),
                "risk": z.risk_level.value if hasattr(z.risk_level, 'value') else str(z.risk_level),
                "affected": z.affected_population,
                "lat": z.latitude, "lon": z.longitude,
            } for z in zones
        ],
    }

@router.get("/report")
def generate_report(db: Session = Depends(get_db)):
    victims  = db.query(Victim).all()
    shelters = db.query(Shelter).all()
    zones    = db.query(DisasterZone).filter(DisasterZone.is_active == True).all()
    total_cap = sum(s.total_capacity for s in shelters)
    total_occ = sum(s.current_occupancy for s in shelters)
    allocated = sum(1 for v in victims if v.is_allocated)

    return {
        "report_title": "RESCUE AI Emergency Response Report",
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
        "data_note": "⚠ SIMULATED DATA — For demonstration purposes only",
        "summary": {
            "total_affected_population": sum(z.affected_population for z in zones),
            "registered_victims": len(victims),
            "successfully_allocated": allocated,
            "unallocated": len(victims) - allocated,
            "allocation_rate_pct": round(allocated / max(len(victims), 1) * 100, 1),
        },
        "shelter_stats": {
            "total_shelters": len(shelters),
            "operational": sum(1 for s in shelters if s.status == ShelterStatus.OPERATIONAL),
            "total_capacity": total_cap,
            "current_occupancy": total_occ,
            "available_spaces": total_cap - total_occ,
            "occupancy_rate_pct": round(total_occ / max(total_cap, 1) * 100, 1),
            "medical_facilities": sum(1 for s in shelters if s.has_medical),
            "accessible_facilities": sum(1 for s in shelters if s.is_accessible),
        },
        "vulnerability_stats": {
            "medical_needs": sum(1 for v in victims if v.medical_conditions),
            "disabled": sum(1 for v in victims if v.has_disability),
            "elderly": sum(1 for v in victims if v.elderly_count > 0),
            "children": sum(1 for v in victims if v.children_count > 0),
            "critical_priority": sum(1 for v in victims if (v.priority.value if hasattr(v.priority, 'value') else str(v.priority)) == "critical"),
        },
        "disaster_zones": [
            {
                "name": z.name,
                "type": z.disaster_type.value if hasattr(z.disaster_type, 'value') else str(z.disaster_type),
                "risk": z.risk_level.value if hasattr(z.risk_level, 'value') else str(z.risk_level),
                "affected": z.affected_population,
            } for z in zones
        ],
        "algorithm_performance": {
            "CSP": {"accuracy": "97.3%", "avg_time_ms": 45, "states_explored": 847},
            "Backtracking": {"accuracy": "95.1%", "avg_time_ms": 112, "states_explored": 2341},
            "Bayesian": {"accuracy": "93.8%", "avg_time_ms": 38, "states_explored": 420},
            "Multi-Agent": {"accuracy": "98.7%", "avg_time_ms": 234, "states_explored": 1240},
        },
    }
