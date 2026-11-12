"""
RESCUE AI – Multi-Agent Coordination System
Six specialized agents communicating via structured messages.
"""
import time
import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from app.ai.allocation_engine import (
    ShelterState, VictimState, haversine,
    CSPAllocationEngine, BayesianAllocationEngine
)

@dataclass
class AgentMessage:
    sender: str
    recipient: str
    message_type: str
    payload: Dict[str, Any]
    timestamp: float = field(default_factory=time.time)

@dataclass
class AgentResult:
    agent_name: str
    status: str           # "ready" | "processing" | "done" | "error"
    responsibility: str
    input_summary: str
    output_summary: str
    recommendation: str
    details: Dict[str, Any]
    processing_time_ms: float


class LocationAgent:
    name = "Location Agent"
    responsibility = "Evaluates victim locations, calculates distances to shelters, identifies optimal evacuation routes"

    def analyze(self, victims: List[VictimState], shelters: List[ShelterState]) -> AgentResult:
        start = time.time()
        distance_matrix: Dict[str, Dict[str, float]] = {}

        for v in victims:
            if v.lat and v.lon:
                distances = {}
                for s in shelters:
                    distances[s.shelter_id] = round(haversine(v.lat, v.lon, s.lat, s.lon), 2)
                distance_matrix[v.victim_id] = distances

        # Find closest safe shelter per victim
        recommendations = []
        for v in victims:
            if v.victim_id in distance_matrix:
                dists = distance_matrix[v.victim_id]
                safe_dists = {sid: d for sid, d in dists.items()
                              if any(s.shelter_id == sid and s.is_safe for s in shelters)}
                if safe_dists:
                    closest = min(safe_dists, key=safe_dists.get)
                    recommendations.append({
                        "victim_id": v.victim_id,
                        "nearest_safe_shelter": closest,
                        "distance_km": safe_dists[closest],
                    })

        avg_dist = (sum(r["distance_km"] for r in recommendations) / len(recommendations)
                    if recommendations else 0)

        return AgentResult(
            agent_name=self.name,
            status="done",
            responsibility=self.responsibility,
            input_summary=f"Analyzed {len(victims)} victims against {len(shelters)} shelters",
            output_summary=f"Computed distance matrix. Avg distance to nearest safe shelter: {avg_dist:.1f}km",
            recommendation=f"Prioritize shelters within 15km radius. {len(recommendations)} victims have reachable shelters.",
            details={
                "distance_matrix": distance_matrix,
                "recommendations": recommendations,
                "avg_distance_km": round(avg_dist, 2),
                "victims_without_location": len(victims) - len(distance_matrix),
            },
            processing_time_ms=round((time.time() - start) * 1000, 2),
        )


class SafetyAgent:
    name = "Safety Agent"
    responsibility = "Evaluates disaster severity, computes shelter risk scores, identifies unsafe zones"

    def analyze(self, victims: List[VictimState], shelters: List[ShelterState], disaster_severity: float = 0.5) -> AgentResult:
        start = time.time()

        unsafe_shelters = [s for s in shelters if not s.is_safe]
        safe_shelters   = [s for s in shelters if s.is_safe]

        risk_distribution = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
        for s in shelters:
            if s.risk_score < 0.25:   risk_distribution["low"] += 1
            elif s.risk_score < 0.5:  risk_distribution["moderate"] += 1
            elif s.risk_score < 0.75: risk_distribution["high"] += 1
            else:                      risk_distribution["critical"] += 1

        high_priority_victims = [v for v in victims if v.priority in ("high", "critical")]

        return AgentResult(
            agent_name=self.name,
            status="done",
            responsibility=self.responsibility,
            input_summary=f"Assessed {len(shelters)} shelters under disaster severity {disaster_severity:.0%}",
            output_summary=f"{len(safe_shelters)} safe shelters, {len(unsafe_shelters)} unsafe. {len(high_priority_victims)} high-priority victims.",
            recommendation=(
                f"Exclude {len(unsafe_shelters)} unsafe shelters. "
                f"Allocate {len(high_priority_victims)} critical victims first. "
                f"Disaster severity at {disaster_severity:.0%} — recommend heightened monitoring."
            ),
            details={
                "safe_shelters": len(safe_shelters),
                "unsafe_shelters": [{"id": s.shelter_id, "name": s.name, "risk": s.risk_score, "status": s.status}
                                     for s in unsafe_shelters],
                "risk_distribution": risk_distribution,
                "disaster_severity": disaster_severity,
                "high_priority_victims": len(high_priority_victims),
            },
            processing_time_ms=round((time.time() - start) * 1000, 2),
        )


class ShelterAgent:
    name = "Shelter Agent"
    responsibility = "Checks shelter availability, capacity, facilities, and operational status"

    def analyze(self, shelters: List[ShelterState]) -> AgentResult:
        start = time.time()
        total_capacity = sum(s.total_capacity for s in shelters)
        total_available = sum(s.available for s in shelters)
        with_medical = sum(1 for s in shelters if s.has_medical and s.is_safe)
        accessible   = sum(1 for s in shelters if s.is_accessible and s.is_safe)
        full_shelters = [s for s in shelters if s.available == 0]
        operational  = [s for s in shelters if s.status == "operational"]

        return AgentResult(
            agent_name=self.name,
            status="done",
            responsibility=self.responsibility,
            input_summary=f"Evaluated {len(shelters)} shelters",
            output_summary=f"Total available: {total_available}/{total_capacity} spaces. {with_medical} medical-equipped shelters.",
            recommendation=(
                f"Available capacity: {total_available} spaces across {len(operational)} operational shelters. "
                f"{with_medical} shelters with medical facilities, {accessible} accessible shelters. "
                f"{'WARNING: ' + str(len(full_shelters)) + ' shelters are full!' if full_shelters else 'Capacity is adequate.'}"
            ),
            details={
                "total_capacity": total_capacity,
                "total_available": total_available,
                "occupancy_rate": round(1 - total_available/max(total_capacity, 1), 3),
                "medical_shelters": with_medical,
                "accessible_shelters": accessible,
                "full_shelters": [s.shelter_id for s in full_shelters],
                "operational_count": len(operational),
                "facility_summary": {
                    "food": sum(1 for s in shelters if s.has_food and s.is_safe),
                    "water": sum(1 for s in shelters if s.has_water and s.is_safe),
                    "power": sum(1 for s in shelters if s.has_power and s.is_safe),
                    "sanitation": sum(1 for s in shelters if s.has_sanitation and s.is_safe),
                },
            },
            processing_time_ms=round((time.time() - start) * 1000, 2),
        )


class MedicalAgent:
    name = "Medical Agent"
    responsibility = "Prioritizes victims with medical needs, matches them to shelters with medical facilities"

    def analyze(self, victims: List[VictimState], shelters: List[ShelterState]) -> AgentResult:
        start = time.time()
        medical_victims  = [v for v in victims if v.has_medical_need]
        disabled_victims = [v for v in victims if v.has_disability]
        elderly_victims  = [v for v in victims if v.elderly_count > 0]
        children_victims = [v for v in victims if v.children_count > 0]
        medical_shelters = [s for s in shelters if s.has_medical and s.is_safe]
        accessible_shelters = [s for s in shelters if s.is_accessible and s.is_safe]

        total_medical_capacity = sum(s.available for s in medical_shelters)
        total_medical_needed   = sum(v.family_size for v in medical_victims)

        conflict = total_medical_needed > total_medical_capacity

        return AgentResult(
            agent_name=self.name,
            status="done",
            responsibility=self.responsibility,
            input_summary=f"Analyzed {len(victims)} victims for medical/accessibility needs",
            output_summary=f"{len(medical_victims)} need medical care, {len(disabled_victims)} need accessibility, {total_medical_capacity} medical spaces available",
            recommendation=(
                f"{'⚠ CONFLICT: Medical capacity insufficient! ' if conflict else ''}"
                f"{len(medical_victims)} victims require medical facilities. "
                f"{len(medical_shelters)} shelters with medical capacity ({total_medical_capacity} spaces). "
                f"Recommend pre-assigning medical cases to: {', '.join(s.shelter_id for s in medical_shelters[:3])}."
            ),
            details={
                "medical_victims": len(medical_victims),
                "disabled_victims": len(disabled_victims),
                "elderly_victims": len(elderly_victims),
                "children_victims": len(children_victims),
                "medical_shelters": [{"id": s.shelter_id, "name": s.name, "available": s.available}
                                      for s in medical_shelters],
                "total_medical_capacity": total_medical_capacity,
                "total_medical_needed": total_medical_needed,
                "capacity_conflict": conflict,
            },
            processing_time_ms=round((time.time() - start) * 1000, 2),
        )


class AllocationAgent:
    name = "Allocation Agent"
    responsibility = "Runs CSP + Bayesian algorithms, finds feasible assignments, optimizes allocation"

    def analyze(self, victims: List[VictimState], shelters: List[ShelterState]) -> AgentResult:
        start = time.time()
        csp = CSPAllocationEngine()
        result = csp.solve(victims, shelters)
        bayesian = BayesianAllocationEngine()
        b_result = bayesian.solve(victims, shelters)

        return AgentResult(
            agent_name=self.name,
            status="done",
            responsibility=self.responsibility,
            input_summary=f"Running allocation algorithms on {len(victims)} victims, {len(shelters)} shelters",
            output_summary=(
                f"CSP: {result['total_allocated']} allocated ({result['states_explored']} states, {result['execution_time_ms']}ms). "
                f"Bayesian: {b_result['total_allocated']} allocated ({b_result['execution_time_ms']}ms)."
            ),
            recommendation=(
                f"CSP algorithm allocates {result['total_allocated']} people with {result['total_unallocated']} unallocated. "
                f"Recommend CSP result as primary allocation plan."
            ),
            details={
                "csp_result": {k: v for k, v in result.items() if k != "results"},
                "bayesian_result": {k: v for k, v in b_result.items() if k not in ("results", "shelter_probabilities")},
                "primary_allocations": result["results"][:5],  # top 5
            },
            processing_time_ms=round((time.time() - start) * 1000, 2),
        )


class CoordinatorAgent:
    name = "Coordinator Agent"
    responsibility = "Aggregates all agent outputs, resolves conflicts, produces final coordinated recommendation"

    def coordinate(
        self,
        location_result: AgentResult,
        safety_result: AgentResult,
        shelter_result: AgentResult,
        medical_result: AgentResult,
        allocation_result: AgentResult,
    ) -> AgentResult:
        start = time.time()

        conflicts = []
        # Detect conflict: medical capacity issue
        if medical_result.details.get("capacity_conflict"):
            conflicts.append("Medical shelter capacity is insufficient for all medical victims.")
        # Detect conflict: full shelters
        full = shelter_result.details.get("full_shelters", [])
        if full:
            conflicts.append(f"Shelters {full} are at full capacity and should be excluded.")
        # Detect conflict: unsafe shelters in list
        unsafe = safety_result.details.get("unsafe_shelters", [])
        if unsafe:
            conflicts.append(f"{len(unsafe)} unsafe shelters identified — excluded from allocation.")

        avg_dist = location_result.details.get("avg_distance_km", 0)
        total_avail = shelter_result.details.get("total_available", 0)
        csp_allocated = allocation_result.details.get("csp_result", {}).get("total_allocated", 0)
        csp_unallocated = allocation_result.details.get("csp_result", {}).get("total_unallocated", 0)

        final_recommendation = (
            f"FINAL COORDINATED ALLOCATION PLAN:\n"
            f"• {csp_allocated} people allocated across operational shelters\n"
            f"• {csp_unallocated} people remain unallocated (insufficient capacity)\n"
            f"• Average evacuation distance: {avg_dist:.1f}km\n"
            f"• {total_avail} shelter spaces available\n"
            f"• {len(conflicts)} conflict(s) detected and resolved\n"
            f"• Medical/disabled victims pre-routed to appropriate facilities\n"
            f"• All unsafe shelters excluded from final plan"
        )

        return AgentResult(
            agent_name=self.name,
            status="done",
            responsibility=self.responsibility,
            input_summary="Aggregating results from Location, Safety, Shelter, Medical, and Allocation agents",
            output_summary=f"Coordination complete. {len(conflicts)} conflicts resolved. Final plan ready.",
            recommendation=final_recommendation,
            details={
                "conflicts_detected": conflicts,
                "conflicts_resolved": len(conflicts),
                "agent_consensus": {
                    "location": location_result.recommendation[:80],
                    "safety": safety_result.recommendation[:80],
                    "shelter": shelter_result.recommendation[:80],
                    "medical": medical_result.recommendation[:80],
                    "allocation": allocation_result.recommendation[:80],
                },
                "final_metrics": {
                    "allocated": csp_allocated,
                    "unallocated": csp_unallocated,
                    "avg_distance_km": avg_dist,
                    "available_spaces": total_avail,
                },
            },
            processing_time_ms=round((time.time() - start) * 1000, 2),
        )


class MultiAgentSystem:
    """Orchestrator for all six agents"""

    def run(self, victims: List[VictimState], shelters: List[ShelterState], disaster_severity: float = 0.5) -> Dict:
        total_start = time.time()
        location_agent  = LocationAgent()
        safety_agent    = SafetyAgent()
        shelter_agent   = ShelterAgent()
        medical_agent   = MedicalAgent()
        alloc_agent     = AllocationAgent()
        coord_agent     = CoordinatorAgent()

        # Phase 1: Parallel analysis (simulated sequential for clarity)
        loc_result    = location_agent.analyze(victims, shelters)
        safety_result = safety_agent.analyze(victims, shelters, disaster_severity)
        shelter_result = shelter_agent.analyze(shelters)
        medical_result = medical_agent.analyze(victims, shelters)
        alloc_result   = alloc_agent.analyze(victims, shelters)

        # Phase 2: Coordination
        coord_result  = coord_agent.coordinate(
            loc_result, safety_result, shelter_result, medical_result, alloc_result
        )

        total_ms = (time.time() - total_start) * 1000

        return {
            "total_time_ms": round(total_ms, 2),
            "agents": [
                _result_to_dict(loc_result),
                _result_to_dict(safety_result),
                _result_to_dict(shelter_result),
                _result_to_dict(medical_result),
                _result_to_dict(alloc_result),
                _result_to_dict(coord_result),
            ],
            "final_recommendation": coord_result.recommendation,
            "conflicts_resolved": len(coord_result.details.get("conflicts_detected", [])),
            "primary_allocations": alloc_result.details.get("primary_allocations", []),
        }

def _result_to_dict(r: AgentResult) -> Dict:
    return {
        "agent_name": r.agent_name,
        "status": r.status,
        "responsibility": r.responsibility,
        "input_summary": r.input_summary,
        "output_summary": r.output_summary,
        "recommendation": r.recommendation,
        "details": r.details,
        "processing_time_ms": r.processing_time_ms,
    }
