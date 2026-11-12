"""Pydantic schemas for RESCUE AI API"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

# ─── Enums ────────────────────────────────────────────────────────────────────
class DisasterType(str, Enum):
    FLOOD = "flood"; EARTHQUAKE = "earthquake"
    CYCLONE = "cyclone"; WILDFIRE = "wildfire"; LANDSLIDE = "landslide"

class RiskLevel(str, Enum):
    LOW = "low"; MODERATE = "moderate"; HIGH = "high"; CRITICAL = "critical"

class ShelterStatus(str, Enum):
    OPERATIONAL = "operational"; FULL = "full"
    CLOSED = "closed"; DAMAGED = "damaged"

class PriorityLevel(str, Enum):
    LOW = "low"; MEDIUM = "medium"; HIGH = "high"; CRITICAL = "critical"

# ─── Auth ─────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ─── Disaster Zone ────────────────────────────────────────────────────────────
class DisasterZoneCreate(BaseModel):
    name: str
    disaster_type: DisasterType
    latitude: float
    longitude: float
    radius_km: float = 5.0
    risk_level: RiskLevel = RiskLevel.HIGH
    affected_population: int = 0
    description: Optional[str] = None

class DisasterZoneOut(DisasterZoneCreate):
    id: int; is_active: bool; reported_at: datetime
    class Config: from_attributes = True

# ─── Shelter ──────────────────────────────────────────────────────────────────
class ShelterCreate(BaseModel):
    shelter_id: str
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    total_capacity: int = Field(gt=0)
    current_occupancy: int = Field(ge=0, default=0)
    has_medical: bool = False
    has_food: bool = True
    has_water: bool = True
    has_sanitation: bool = True
    is_accessible: bool = True
    has_power: bool = True
    has_communication: bool = True
    risk_score: float = Field(ge=0.0, le=1.0, default=0.1)
    status: ShelterStatus = ShelterStatus.OPERATIONAL
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    notes: Optional[str] = None

class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    total_capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    has_medical: Optional[bool] = None
    has_food: Optional[bool] = None
    has_water: Optional[bool] = None
    has_sanitation: Optional[bool] = None
    is_accessible: Optional[bool] = None
    has_power: Optional[bool] = None
    has_communication: Optional[bool] = None
    risk_score: Optional[float] = None
    status: Optional[ShelterStatus] = None
    notes: Optional[str] = None

class ShelterOut(ShelterCreate):
    id: int
    available_capacity: int = 0
    occupancy_pct: float = 0.0
    created_at: datetime
    updated_at: datetime
    class Config: from_attributes = True

# ─── Victim ───────────────────────────────────────────────────────────────────
class VictimCreate(BaseModel):
    victim_id: str
    representative_name: str
    family_size: int = Field(ge=1, default=1)
    current_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    medical_conditions: Optional[str] = None
    has_disability: bool = False
    mobility_requirements: Optional[str] = None
    children_count: int = Field(ge=0, default=0)
    elderly_count: int = Field(ge=0, default=0)
    priority: PriorityLevel = PriorityLevel.MEDIUM
    special_requirements: Optional[str] = None
    disaster_zone_id: Optional[int] = None

class VictimUpdate(BaseModel):
    representative_name: Optional[str] = None
    family_size: Optional[int] = None
    current_location: Optional[str] = None
    medical_conditions: Optional[str] = None
    has_disability: Optional[bool] = None
    children_count: Optional[int] = None
    elderly_count: Optional[int] = None
    priority: Optional[PriorityLevel] = None
    special_requirements: Optional[str] = None

class VictimOut(VictimCreate):
    id: int; is_allocated: bool; registered_at: datetime
    class Config: from_attributes = True

# ─── Allocation ───────────────────────────────────────────────────────────────
class AllocationRequest(BaseModel):
    algorithm: str = "csp"  # csp | backtracking | bayesian | multi_agent
    victim_ids: Optional[List[int]] = None  # None = allocate all unallocated
    weights: Optional[dict] = None          # custom optimization weights
    what_if: Optional[dict] = None          # simulation parameters

class AllocationResult(BaseModel):
    victim_id: int
    victim_name: str
    shelter_id: str
    shelter_name: str
    allocated_people: int
    score: float
    explanation: str
    risk_score: float
    distance_km: float
    algorithm: str

class AllocationResponse(BaseModel):
    success: bool
    algorithm: str
    total_allocated: int
    total_unallocated: int
    states_explored: int
    execution_time_ms: float
    results: List[AllocationResult]
    unallocated_victims: List[dict]
    summary: str
    warnings: List[str]

# ─── Chat ─────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    session_id: str
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    reply: str
    sources: List[dict] = []
    action_taken: Optional[str] = None
    requires_approval: bool = False

# ─── Analytics ────────────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_affected: int
    registered_victims: int
    active_shelters: int
    total_capacity: int
    available_spaces: int
    occupancy_pct: float
    high_risk_zones: int
    pending_allocations: int
    successful_allocations: int
    disaster_zones: List[dict]
    recent_activities: List[dict]
    alerts: List[dict]
