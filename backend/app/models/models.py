"""SQLAlchemy ORM models for RESCUE AI"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class DisasterType(str, enum.Enum):
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    CYCLONE = "cyclone"
    WILDFIRE = "wildfire"
    LANDSLIDE = "landslide"

class RiskLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class ShelterStatus(str, enum.Enum):
    OPERATIONAL = "operational"
    FULL = "full"
    CLOSED = "closed"
    DAMAGED = "damaged"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    role = Column(SAEnum(UserRole), default=UserRole.OPERATOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DisasterZone(Base):
    __tablename__ = "disaster_zones"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    disaster_type = Column(SAEnum(DisasterType), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=5.0)
    risk_level = Column(SAEnum(RiskLevel), default=RiskLevel.HIGH)
    affected_population = Column(Integer, default=0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Shelter(Base):
    __tablename__ = "shelters"
    id = Column(Integer, primary_key=True, index=True)
    shelter_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    address = Column(String(250))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    has_medical = Column(Boolean, default=False)
    has_food = Column(Boolean, default=True)
    has_water = Column(Boolean, default=True)
    has_sanitation = Column(Boolean, default=True)
    is_accessible = Column(Boolean, default=True)
    has_power = Column(Boolean, default=True)
    has_communication = Column(Boolean, default=True)
    risk_score = Column(Float, default=0.1)
    status = Column(SAEnum(ShelterStatus), default=ShelterStatus.OPERATIONAL)
    contact_name = Column(String(100))
    contact_phone = Column(String(20))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    allocations = relationship("Allocation", back_populates="shelter")

    @property
    def available_capacity(self):
        return max(0, self.total_capacity - self.current_occupancy)

    @property
    def occupancy_pct(self):
        if self.total_capacity == 0:
            return 0
        return round(self.current_occupancy / self.total_capacity * 100, 1)

class Victim(Base):
    __tablename__ = "victims"
    id = Column(Integer, primary_key=True, index=True)
    victim_id = Column(String(20), unique=True, nullable=False)
    representative_name = Column(String(100), nullable=False)
    family_size = Column(Integer, default=1)
    current_location = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    medical_conditions = Column(Text)
    has_disability = Column(Boolean, default=False)
    mobility_requirements = Column(Text)
    children_count = Column(Integer, default=0)
    elderly_count = Column(Integer, default=0)
    priority = Column(SAEnum(PriorityLevel), default=PriorityLevel.MEDIUM)
    special_requirements = Column(Text)
    disaster_zone_id = Column(Integer, ForeignKey("disaster_zones.id"), nullable=True)
    is_allocated = Column(Boolean, default=False)
    registered_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    allocations = relationship("Allocation", back_populates="victim")

class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(Integer, primary_key=True, index=True)
    victim_id = Column(Integer, ForeignKey("victims.id"), nullable=False)
    shelter_id = Column(Integer, ForeignKey("shelters.id"), nullable=False)
    allocated_people = Column(Integer, nullable=False)
    allocation_score = Column(Float)
    algorithm_used = Column(String(50))
    explanation = Column(Text)
    risk_score = Column(Float)
    distance_km = Column(Float)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    allocated_at = Column(DateTime, default=datetime.utcnow)
    victim = relationship("Victim", back_populates="allocations")
    shelter = relationship("Shelter", back_populates="allocations")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    sources = Column(Text)  # JSON list of source references
    timestamp = Column(DateTime, default=datetime.utcnow)
