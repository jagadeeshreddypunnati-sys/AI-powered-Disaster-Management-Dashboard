"""
RESCUE AI – Core Allocation Engine
Implements: CSP, Backtracking Search, Bayesian Reasoning, Optimization
"""
import time
import math
import random
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, field

# ─── Data Structures ──────────────────────────────────────────────────────────
@dataclass
class ShelterState:
    id: int
    shelter_id: str
    name: str
    lat: float
    lon: float
    total_capacity: int
    current_occupancy: int
    has_medical: bool
    has_food: bool
    has_water: bool
    has_sanitation: bool
    is_accessible: bool
    has_power: bool
    risk_score: float
    status: str

    @property
    def available(self) -> int:
        return max(0, self.total_capacity - self.current_occupancy)

    @property
    def is_safe(self) -> bool:
        return self.status == "operational" and self.risk_score < 0.7 and self.available > 0

@dataclass
class VictimState:
    id: int
    victim_id: str
    name: str
    family_size: int
    lat: Optional[float]
    lon: Optional[float]
    has_medical_need: bool
    has_disability: bool
    children_count: int
    elderly_count: int
    priority: str  # low | medium | high | critical

    @property
    def vulnerability_score(self) -> float:
        score = 0.0
        if self.priority == "critical": score += 0.4
        elif self.priority == "high": score += 0.3
        elif self.priority == "medium": score += 0.2
        else: score += 0.1
        if self.has_medical_need: score += 0.2
        if self.has_disability: score += 0.15
        if self.elderly_count > 0: score += 0.1
        if self.children_count > 0: score += 0.1
        return min(1.0, score)

@dataclass
class AllocationState:
    assignments: Dict[int, int] = field(default_factory=dict)  # victim_id -> shelter_id
    shelter_loads: Dict[int, int] = field(default_factory=dict)  # shelter_id -> assigned people

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in km between two coordinates"""
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ─── CSP Engine ───────────────────────────────────────────────────────────────
class CSPAllocationEngine:
    """Constraint Satisfaction Problem solver for shelter allocation"""

    DEFAULT_WEIGHTS = {
        "safety": 0.35,
        "distance": 0.25,
        "overcrowding": 0.20,
        "medical": 0.15,
        "vulnerability": 0.05,
    }

    def __init__(self, weights: Optional[Dict] = None):
        self.weights = weights or self.DEFAULT_WEIGHTS
        self.states_explored = 0

    def satisfies_constraints(
        self,
        victim: VictimState,
        shelter: ShelterState,
        state: AllocationState,
    ) -> Tuple[bool, str]:
        """Check all hard constraints"""
        # Constraint 1: Shelter must be operational and safe
        if not shelter.is_safe:
            return False, f"Shelter {shelter.shelter_id} is not safe (status={shelter.status}, risk={shelter.risk_score:.2f})"
        # Constraint 2: Capacity
        already_assigned = state.shelter_loads.get(shelter.id, 0)
        if already_assigned + victim.family_size > shelter.total_capacity:
            return False, f"Insufficient capacity at {shelter.shelter_id}"
        # Constraint 3: Medical compatibility
        if victim.has_medical_need and not shelter.has_medical:
            return False, f"{shelter.shelter_id} lacks medical facilities (required)"
        # Constraint 4: Accessibility
        if victim.has_disability and not shelter.is_accessible:
            return False, f"{shelter.shelter_id} is not accessible (required for disability)"
        # Constraint 5: Basic needs
        if not shelter.has_food or not shelter.has_water:
            return False, f"{shelter.shelter_id} lacks basic food/water"
        return True, "All constraints satisfied"

    def compute_score(
        self,
        victim: VictimState,
        shelter: ShelterState,
        state: AllocationState,
        distance_km: float,
    ) -> float:
        """Compute allocation objective score (higher = better)"""
        w = self.weights
        # Safety score (inverse of risk)
        safety = (1.0 - shelter.risk_score) * w["safety"]
        # Distance score (normalize to 0-50 km range)
        dist_score = max(0, 1.0 - distance_km / 50.0) * w["distance"]
        # Overcrowding penalty
        load = state.shelter_loads.get(shelter.id, 0) + victim.family_size
        occ_pct = load / shelter.total_capacity
        overcrowd_score = max(0, 1.0 - occ_pct) * w["overcrowding"]
        # Medical bonus
        med_score = (1.0 if shelter.has_medical else 0.5) * w["medical"]
        # Vulnerability priority
        vuln_score = victim.vulnerability_score * w["vulnerability"]
        return safety + dist_score + overcrowd_score + med_score + vuln_score

    def solve(
        self,
        victims: List[VictimState],
        shelters: List[ShelterState],
    ) -> Dict:
        start = time.time()
        self.states_explored = 0

        # Sort victims: critical/high priority first
        victims = sorted(victims, key=lambda v: -v.vulnerability_score)
        safe_shelters = [s for s in shelters if s.is_safe]

        state = AllocationState()
        results = []
        unallocated = []
        warnings = []

        for shelter in safe_shelters:
            state.shelter_loads[shelter.id] = shelter.current_occupancy

        for victim in victims:
            best_shelter = None
            best_score = -1.0
            constraint_msg = ""

            for shelter in safe_shelters:
                self.states_explored += 1
                ok, msg = self.satisfies_constraints(victim, shelter, state)
                if not ok:
                    constraint_msg = msg
                    continue

                dist = 20.0  # default
                if victim.lat and victim.lon:
                    dist = haversine(victim.lat, victim.lon, shelter.lat, shelter.lon)

                score = self.compute_score(victim, shelter, state, dist)
                if score > best_score:
                    best_score = score
                    best_shelter = shelter
                    best_distance = dist

            if best_shelter:
                state.assignments[victim.id] = best_shelter.id
                state.shelter_loads[best_shelter.id] = (
                    state.shelter_loads.get(best_shelter.id, 0) + victim.family_size
                )
                explanation = (
                    f"Assigned to {best_shelter.name} — Score: {best_score:.3f}. "
                    f"Safety: {(1-best_shelter.risk_score)*100:.0f}%, "
                    f"Distance: {best_distance:.1f}km, "
                    f"Medical: {'Yes' if best_shelter.has_medical else 'No'}, "
                    f"Capacity remaining: {best_shelter.total_capacity - state.shelter_loads[best_shelter.id]}"
                )
                results.append({
                    "victim_id": victim.id,
                    "victim_name": victim.name,
                    "shelter_id": best_shelter.shelter_id,
                    "shelter_name": best_shelter.name,
                    "allocated_people": victim.family_size,
                    "score": round(best_score, 4),
                    "explanation": explanation,
                    "risk_score": round(best_shelter.risk_score, 3),
                    "distance_km": round(best_distance, 2),
                    "algorithm": "CSP",
                })
            else:
                unallocated.append({
                    "victim_id": victim.id,
                    "victim_name": victim.name,
                    "family_size": victim.family_size,
                    "reason": constraint_msg or "No safe shelter with sufficient capacity",
                })
                if victim.priority in ("high", "critical"):
                    warnings.append(
                        f"⚠ HIGH PRIORITY victim {victim.name} (ID:{victim.victim_id}) could not be allocated!"
                    )

        exec_ms = (time.time() - start) * 1000
        return {
            "success": len(unallocated) == 0,
            "algorithm": "CSP",
            "total_allocated": sum(r["allocated_people"] for r in results),
            "total_unallocated": sum(u["family_size"] for u in unallocated),
            "states_explored": self.states_explored,
            "execution_time_ms": round(exec_ms, 2),
            "results": results,
            "unallocated_victims": unallocated,
            "warnings": warnings,
            "summary": (
                f"CSP allocated {len(results)} victim groups ({sum(r['allocated_people'] for r in results)} people) "
                f"across {len(set(r['shelter_id'] for r in results))} shelters. "
                f"Explored {self.states_explored} states in {exec_ms:.1f}ms. "
                f"{len(unallocated)} groups remain unallocated."
            ),
        }


# ─── Backtracking Engine ──────────────────────────────────────────────────────
class BacktrackingEngine:
    """Backtracking search for shelter allocation"""

    def __init__(self, max_states: int = 10000):
        self.max_states = max_states
        self.states_explored = 0

    def _backtrack(
        self,
        victim_idx: int,
        victims: List[VictimState],
        shelters: List[ShelterState],
        state: AllocationState,
        results: List[dict],
    ) -> bool:
        if self.states_explored >= self.max_states:
            return True  # cut off

        if victim_idx == len(victims):
            return True

        victim = victims[victim_idx]
        # Order shelters by safety first (heuristic)
        ordered = sorted(shelters, key=lambda s: s.risk_score)

        for shelter in ordered:
            self.states_explored += 1
            # Check constraints
            already = state.shelter_loads.get(shelter.id, 0)
            if (
                shelter.is_safe
                and already + victim.family_size <= shelter.total_capacity
                and (not victim.has_medical_need or shelter.has_medical)
                and (not victim.has_disability or shelter.is_accessible)
                and shelter.has_food and shelter.has_water
            ):
                # Assign
                state.assignments[victim.id] = shelter.id
                state.shelter_loads[shelter.id] = already + victim.family_size

                dist = 20.0
                if victim.lat and victim.lon:
                    dist = haversine(victim.lat, victim.lon, shelter.lat, shelter.lon)

                results.append({
                    "victim_id": victim.id,
                    "victim_name": victim.name,
                    "shelter_id": shelter.shelter_id,
                    "shelter_name": shelter.name,
                    "allocated_people": victim.family_size,
                    "score": round(1.0 - shelter.risk_score, 4),
                    "explanation": f"Backtracking assigned {victim.name} to {shelter.name} (first valid assignment found)",
                    "risk_score": round(shelter.risk_score, 3),
                    "distance_km": round(dist, 2),
                    "algorithm": "Backtracking",
                })

                if self._backtrack(victim_idx + 1, victims, shelters, state, results):
                    return True

                # Undo (backtrack)
                del state.assignments[victim.id]
                state.shelter_loads[shelter.id] -= victim.family_size
                results.pop()

        return False

    def solve(self, victims: List[VictimState], shelters: List[ShelterState]) -> Dict:
        start = time.time()
        self.states_explored = 0
        victims_sorted = sorted(victims, key=lambda v: -v.vulnerability_score)
        state = AllocationState()
        for s in shelters:
            state.shelter_loads[s.id] = s.current_occupancy

        results = []
        self._backtrack(0, victims_sorted, shelters, state, results)

        unallocated = [
            v for v in victims_sorted
            if v.id not in state.assignments
        ]
        exec_ms = (time.time() - start) * 1000

        return {
            "success": len(unallocated) == 0,
            "algorithm": "Backtracking",
            "total_allocated": sum(r["allocated_people"] for r in results),
            "total_unallocated": sum(v.family_size for v in unallocated),
            "states_explored": self.states_explored,
            "execution_time_ms": round(exec_ms, 2),
            "results": results,
            "unallocated_victims": [
                {"victim_id": v.id, "victim_name": v.name, "family_size": v.family_size,
                 "reason": "No valid assignment found via backtracking"}
                for v in unallocated
            ],
            "warnings": [],
            "summary": (
                f"Backtracking explored {self.states_explored} states in {exec_ms:.1f}ms. "
                f"Allocated {len(results)} groups to shelters."
            ),
        }


# ─── Bayesian Engine ──────────────────────────────────────────────────────────
class BayesianAllocationEngine:
    """Probabilistic reasoning using simplified Bayesian networks"""

    def compute_shelter_safety_probability(
        self,
        shelter: ShelterState,
        disaster_severity: float = 0.5,
    ) -> Dict:
        """
        P(safe | evidence) using Bayes rule
        evidence: power, communication, risk_score, disaster_severity
        """
        # Prior: base safety
        prior_safe = 1.0 - shelter.risk_score

        # Likelihood factors
        power_factor = 0.95 if shelter.has_power else 0.60
        comm_factor  = 0.95 if shelter.has_communication else 0.70
        disaster_factor = max(0.1, 1.0 - disaster_severity * shelter.risk_score)

        # Posterior (simplified product of likelihoods)
        posterior = prior_safe * power_factor * comm_factor * disaster_factor
        posterior = min(0.99, max(0.01, posterior))

        # Confidence interval (simplified)
        uncertainty = 0.1 + (1.0 - posterior) * 0.2
        ci_low  = max(0.0, posterior - uncertainty)
        ci_high = min(1.0, posterior + uncertainty)

        return {
            "safety_probability": round(posterior, 4),
            "confidence_interval": [round(ci_low, 4), round(ci_high, 4)],
            "uncertainty": round(uncertainty, 4),
            "factors": {
                "prior_safety": round(prior_safe, 4),
                "power_factor": power_factor,
                "communication_factor": comm_factor,
                "disaster_impact": round(disaster_factor, 4),
            },
        }

    def solve(self, victims: List[VictimState], shelters: List[ShelterState], disaster_severity: float = 0.5) -> Dict:
        start = time.time()
        states_explored = 0

        # Compute probabilities for all shelters
        shelter_probs = {}
        for s in shelters:
            if s.is_safe:
                shelter_probs[s.id] = self.compute_shelter_safety_probability(s, disaster_severity)

        victims_sorted = sorted(victims, key=lambda v: -v.vulnerability_score)
        shelter_loads: Dict[int, int] = {s.id: s.current_occupancy for s in shelters}

        results = []
        unallocated = []

        for victim in victims_sorted:
            best_shelter = None
            best_prob = -1.0
            best_dist = 0.0

            for shelter in shelters:
                if shelter.id not in shelter_probs:
                    continue
                states_explored += 1
                already = shelter_loads.get(shelter.id, 0)
                if already + victim.family_size > shelter.total_capacity:
                    continue
                if victim.has_medical_need and not shelter.has_medical:
                    continue
                if victim.has_disability and not shelter.is_accessible:
                    continue

                prob = shelter_probs[shelter.id]["safety_probability"]
                dist = 20.0
                if victim.lat and victim.lon:
                    dist = haversine(victim.lat, victim.lon, shelter.lat, shelter.lon)
                    prob *= max(0.5, 1.0 - dist / 100.0)  # decay by distance

                if prob > best_prob:
                    best_prob = prob
                    best_shelter = shelter
                    best_dist = dist

            if best_shelter:
                shelter_loads[best_shelter.id] += victim.family_size
                p_info = shelter_probs[best_shelter.id]
                explanation = (
                    f"Bayesian safety P={p_info['safety_probability']:.3f} "
                    f"(CI: [{p_info['confidence_interval'][0]:.3f}, {p_info['confidence_interval'][1]:.3f}]). "
                    f"Uncertainty: ±{p_info['uncertainty']:.3f}. "
                    f"Distance: {best_dist:.1f}km."
                )
                results.append({
                    "victim_id": victim.id,
                    "victim_name": victim.name,
                    "shelter_id": best_shelter.shelter_id,
                    "shelter_name": best_shelter.name,
                    "allocated_people": victim.family_size,
                    "score": round(best_prob, 4),
                    "explanation": explanation,
                    "risk_score": round(best_shelter.risk_score, 3),
                    "distance_km": round(best_dist, 2),
                    "algorithm": "Bayesian",
                    "bayesian_details": p_info,
                })
            else:
                unallocated.append({
                    "victim_id": victim.id,
                    "victim_name": victim.name,
                    "family_size": victim.family_size,
                    "reason": "No shelter with sufficient safety probability",
                })

        exec_ms = (time.time() - start) * 1000
        return {
            "success": len(unallocated) == 0,
            "algorithm": "Bayesian",
            "total_allocated": sum(r["allocated_people"] for r in results),
            "total_unallocated": sum(u["family_size"] for u in unallocated),
            "states_explored": states_explored,
            "execution_time_ms": round(exec_ms, 2),
            "results": results,
            "unallocated_victims": unallocated,
            "warnings": [],
            "shelter_probabilities": {s.shelter_id: shelter_probs.get(s.id, {}) for s in shelters},
            "summary": (
                f"Bayesian reasoning allocated {len(results)} groups using probabilistic safety scores. "
                f"Disaster severity: {disaster_severity:.0%}. "
                f"Executed in {exec_ms:.1f}ms."
            ),
        }
