"""Seed database with realistic sample data for RESCUE AI"""
import os
from datetime import datetime

SEEDED = False

def seed_database():
    global SEEDED
    if SEEDED:
        return
    try:
        from app.core.database import SessionLocal
        from app.models.models import (
            User, DisasterZone, Shelter, Victim,
            DisasterType, RiskLevel, ShelterStatus, PriorityLevel, UserRole
        )
        from app.core.security import get_password_hash

        db = SessionLocal()

        # Only seed if empty
        if db.query(User).count() > 0:
            db.close()
            SEEDED = True
            return

        # ─── Users ────────────────────────────────────────────────────────────
        users = [
            User(username="admin", email="admin@rescueai.gov", full_name="System Administrator",
                 hashed_password=get_password_hash("admin123"), role=UserRole.ADMIN, is_active=True),
            User(username="operator1", email="op1@rescueai.gov", full_name="Field Operator",
                 hashed_password=get_password_hash("operator123"), role=UserRole.OPERATOR, is_active=True),
            User(username="viewer", email="viewer@rescueai.gov", full_name="Report Viewer",
                 hashed_password=get_password_hash("viewer123"), role=UserRole.VIEWER, is_active=True),
        ]
        db.add_all(users)

        # ─── Disaster Zones ───────────────────────────────────────────────────
        zones = [
            DisasterZone(name="Chennai Coastal Flood Zone", disaster_type=DisasterType.FLOOD,
                         latitude=13.0827, longitude=80.2707, radius_km=15.0,
                         risk_level=RiskLevel.CRITICAL, affected_population=12500,
                         description="Severe flooding in coastal areas due to cyclonic storm surge"),
            DisasterZone(name="Western Ghats Landslide Zone", disaster_type=DisasterType.LANDSLIDE,
                         latitude=10.3524, longitude=76.5222, radius_km=8.0,
                         risk_level=RiskLevel.HIGH, affected_population=3200,
                         description="Multiple landslides blocking evacuation routes"),
            DisasterZone(name="Coimbatore Earthquake Zone", disaster_type=DisasterType.EARTHQUAKE,
                         latitude=11.0168, longitude=76.9558, radius_km=20.0,
                         risk_level=RiskLevel.HIGH, affected_population=8700,
                         description="M5.8 earthquake with aftershocks expected"),
            DisasterZone(name="Nilgiris Wildfire Zone", disaster_type=DisasterType.WILDFIRE,
                         latitude=11.4133, longitude=76.6950, radius_km=12.0,
                         risk_level=RiskLevel.MODERATE, affected_population=1800,
                         description="Forest fire spreading towards residential areas"),
            DisasterZone(name="Bay of Bengal Cyclone Zone", disaster_type=DisasterType.CYCLONE,
                         latitude=12.9716, longitude=80.0000, radius_km=50.0,
                         risk_level=RiskLevel.CRITICAL, affected_population=25000,
                         description="Category 4 cyclone expected landfall in 18 hours"),
        ]
        db.add_all(zones)

        # ─── Shelters ─────────────────────────────────────────────────────────
        shelters = [
            Shelter(shelter_id="S-01", name="Gandhi Community Center", address="Anna Nagar, Chennai",
                    latitude=13.0850, longitude=80.2101, total_capacity=800, current_occupancy=320,
                    has_medical=True, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=True, has_communication=True,
                    risk_score=0.08, status=ShelterStatus.OPERATIONAL,
                    contact_name="Ravi Kumar", contact_phone="+91-9876543210"),
            Shelter(shelter_id="S-02", name="St. Thomas School Shelter", address="Mylapore, Chennai",
                    latitude=13.0339, longitude=80.2676, total_capacity=500, current_occupancy=480,
                    has_medical=True, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=True, has_communication=True,
                    risk_score=0.22, status=ShelterStatus.OPERATIONAL,
                    contact_name="Sr. Mary Joseph", contact_phone="+91-9876543211"),
            Shelter(shelter_id="S-03", name="Tambaram Sports Complex", address="Tambaram, Chennai",
                    latitude=12.9249, longitude=80.1000, total_capacity=1200, current_occupancy=410,
                    has_medical=False, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=True, has_communication=True,
                    risk_score=0.12, status=ShelterStatus.OPERATIONAL,
                    contact_name="Suresh Babu", contact_phone="+91-9876543212"),
            Shelter(shelter_id="S-04", name="DRDA Relief Camp Alpha", address="Pallavaram, Chennai",
                    latitude=12.9686, longitude=80.1529, total_capacity=600, current_occupancy=180,
                    has_medical=True, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=True, has_communication=True,
                    risk_score=0.10, status=ShelterStatus.OPERATIONAL,
                    contact_name="Dr. Priya Nair", contact_phone="+91-9876543213"),
            Shelter(shelter_id="S-05", name="Municipal High School Camp", address="Chromepet, Chennai",
                    latitude=12.9516, longitude=80.1462, total_capacity=400, current_occupancy=390,
                    has_medical=False, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=False, has_power=True, has_communication=True,
                    risk_score=0.18, status=ShelterStatus.OPERATIONAL,
                    contact_name="Murugan S", contact_phone="+91-9876543214"),
            Shelter(shelter_id="S-06", name="Army Relief Center Bravo", address="Avadi, Chennai",
                    latitude=13.1143, longitude=80.0982, total_capacity=2000, current_occupancy=650,
                    has_medical=True, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=True, has_communication=True,
                    risk_score=0.05, status=ShelterStatus.OPERATIONAL,
                    contact_name="Major Krishnan", contact_phone="+91-9876543215"),
            Shelter(shelter_id="S-07", name="Poonamallee Convention Hall", address="Poonamallee, Chennai",
                    latitude=13.0469, longitude=80.0974, total_capacity=350, current_occupancy=0,
                    has_medical=False, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=False, has_communication=True,
                    risk_score=0.30, status=ShelterStatus.OPERATIONAL,
                    contact_name="Selvam P", contact_phone="+91-9876543216"),
            Shelter(shelter_id="S-08", name="Coastal Road Damaged Shelter", address="Marina Beach Road",
                    latitude=13.0592, longitude=80.2804, total_capacity=300, current_occupancy=0,
                    has_medical=False, has_food=False, has_water=False, has_sanitation=False,
                    is_accessible=False, has_power=False, has_communication=False,
                    risk_score=0.95, status=ShelterStatus.DAMAGED,
                    contact_name="N/A", contact_phone="N/A",
                    notes="Structure damaged by storm surge. DO NOT USE."),
            Shelter(shelter_id="S-09", name="Sriperumbudur Mega Camp", address="Sriperumbudur, TN",
                    latitude=12.9674, longitude=79.9479, total_capacity=3000, current_occupancy=800,
                    has_medical=True, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=True, has_communication=True,
                    risk_score=0.07, status=ShelterStatus.OPERATIONAL,
                    contact_name="Collector Office", contact_phone="+91-9876543217"),
            Shelter(shelter_id="S-10", name="Red Cross Emergency Hub", address="T. Nagar, Chennai",
                    latitude=13.0418, longitude=80.2338, total_capacity=250, current_occupancy=180,
                    has_medical=True, has_food=True, has_water=True, has_sanitation=True,
                    is_accessible=True, has_power=True, has_communication=True,
                    risk_score=0.15, status=ShelterStatus.OPERATIONAL,
                    contact_name="Red Cross Chapter", contact_phone="+91-9876543218"),
        ]
        db.add_all(shelters)

        # ─── Victims ──────────────────────────────────────────────────────────
        victims_data = [
            dict(victim_id="V-001", representative_name="Rajesh Kumar", family_size=5,
                 current_location="Besant Nagar, Chennai", latitude=12.9990, longitude=80.2680,
                 medical_conditions="Diabetes, Hypertension", has_disability=False,
                 children_count=2, elderly_count=1, priority=PriorityLevel.HIGH),
            dict(victim_id="V-002", representative_name="Meenakshi Sundaram", family_size=3,
                 current_location="Adyar, Chennai", latitude=13.0068, longitude=80.2566,
                 medical_conditions=None, has_disability=False,
                 children_count=1, elderly_count=0, priority=PriorityLevel.MEDIUM),
            dict(victim_id="V-003", representative_name="Ibrahim Sheikh", family_size=7,
                 current_location="Royapuram, Chennai", latitude=13.1115, longitude=80.2947,
                 medical_conditions="Heart condition", has_disability=True,
                 mobility_requirements="Wheelchair access required",
                 children_count=3, elderly_count=1, priority=PriorityLevel.CRITICAL),
            dict(victim_id="V-004", representative_name="Lakshmi Devi", family_size=2,
                 current_location="Velachery, Chennai", latitude=12.9815, longitude=80.2180,
                 medical_conditions=None, has_disability=False,
                 children_count=0, elderly_count=1, priority=PriorityLevel.MEDIUM),
            dict(victim_id="V-005", representative_name="Samuel Rajan", family_size=4,
                 current_location="Ambattur, Chennai", latitude=13.1143, longitude=80.1548,
                 medical_conditions="Asthma", has_disability=False,
                 children_count=2, elderly_count=0, priority=PriorityLevel.HIGH),
            dict(victim_id="V-006", representative_name="Priya Krishnamurthy", family_size=6,
                 current_location="Sholinganallur, Chennai", latitude=12.9010, longitude=80.2279,
                 medical_conditions=None, has_disability=False,
                 children_count=4, elderly_count=0, priority=PriorityLevel.MEDIUM),
            dict(victim_id="V-007", representative_name="Abdul Hameed", family_size=8,
                 current_location="Washermanpet, Chennai", latitude=13.1203, longitude=80.2855,
                 medical_conditions="Kidney disease", has_disability=False,
                 children_count=4, elderly_count=2, priority=PriorityLevel.CRITICAL),
            dict(victim_id="V-008", representative_name="Saranya Murugan", family_size=3,
                 current_location="Porur, Chennai", latitude=13.0317, longitude=80.1575,
                 medical_conditions=None, has_disability=True,
                 mobility_requirements="Mobility aid required",
                 children_count=1, elderly_count=0, priority=PriorityLevel.HIGH),
            dict(victim_id="V-009", representative_name="Thomas Fernandez", family_size=5,
                 current_location="Perambur, Chennai", latitude=13.1159, longitude=80.2410,
                 medical_conditions=None, has_disability=False,
                 children_count=3, elderly_count=0, priority=PriorityLevel.LOW),
            dict(victim_id="V-010", representative_name="Kamala Bai", family_size=1,
                 current_location="Triplicane, Chennai", latitude=13.0598, longitude=80.2794,
                 medical_conditions="Post-surgery recovery", has_disability=True,
                 mobility_requirements="Bed required", children_count=0, elderly_count=1,
                 priority=PriorityLevel.CRITICAL),
            dict(victim_id="V-011", representative_name="Venkatesan R", family_size=4,
                 current_location="Guindy, Chennai", latitude=13.0067, longitude=80.2206,
                 medical_conditions=None, has_disability=False,
                 children_count=2, elderly_count=0, priority=PriorityLevel.MEDIUM),
            dict(victim_id="V-012", representative_name="Fatima Begum", family_size=9,
                 current_location="Pulianthope, Chennai", latitude=13.1021, longitude=80.2609,
                 medical_conditions="Pregnant (8 months)", has_disability=False,
                 children_count=4, elderly_count=1, priority=PriorityLevel.CRITICAL),
        ]
        for vd in victims_data:
            db.add(Victim(**vd))

        db.commit()
        db.close()
        SEEDED = True
        print("✅ Database seeded with sample data.")
    except Exception as e:
        print(f"⚠ Seeding error: {e}")
