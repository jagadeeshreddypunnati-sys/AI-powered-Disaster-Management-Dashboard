"""
RESCUE AI – RescueBot AI Chat Engine
RAG-based chatbot using Gemini API with application data as context
"""
import json
from typing import List, Dict, Optional, Any
from app.core.config import settings

SYSTEM_PROMPT = """You are RescueBot AI, the intelligent assistant for RESCUE AI — an AI-Based Disaster Shelter Allocation and Emergency Response System.

You have access to real-time data from the RESCUE AI platform including:
- Registered victims and their needs
- Available shelters and their capacities
- Current disaster zones and risk levels
- Allocation results and recommendations
- System statistics

IMPORTANT RULES:
1. Only answer questions using the provided application data context.
2. Never invent shelter capacity, occupancy, or operational information.
3. If data is unavailable, clearly say "This information is not currently in the system."
4. For allocation tasks, clearly state you are running the actual allocation engine.
5. Require administrator confirmation before changing any records.
6. Be concise, professional, and evidence-grounded.
7. For algorithm explanations, be accurate and clear.

You are a decision-support assistant, not an autonomous dispatch system.
"""

def build_context(app_data: Dict) -> str:
    """Build RAG context from application data"""
    shelters = app_data.get("shelters", [])
    victims  = app_data.get("victims", [])
    stats    = app_data.get("stats", {})
    zones    = app_data.get("disaster_zones", [])

    ctx_parts = ["=== CURRENT APPLICATION DATA ===\n"]

    # Stats
    ctx_parts.append(f"SYSTEM STATISTICS:\n{json.dumps(stats, indent=2)}\n")

    # Shelters
    ctx_parts.append(f"\nACTIVE SHELTERS ({len(shelters)} total):")
    for s in shelters[:20]:
        ctx_parts.append(
            f"  - {s.get('shelter_id','?')} | {s.get('name','?')} | "
            f"Capacity: {s.get('current_occupancy',0)}/{s.get('total_capacity',0)} | "
            f"Available: {s.get('available_capacity',0)} | "
            f"Status: {s.get('status','?')} | Medical: {s.get('has_medical',False)} | "
            f"Risk: {s.get('risk_score',0):.2f}"
        )

    # Victims (summary)
    total_victims = len(victims)
    allocated = sum(1 for v in victims if v.get("is_allocated"))
    medical_needs = sum(1 for v in victims if v.get("medical_conditions"))
    ctx_parts.append(f"\nVICTIM SUMMARY: {total_victims} registered, {allocated} allocated, {total_victims-allocated} pending")
    ctx_parts.append(f"  Medical needs: {medical_needs}, Disabilities: {sum(1 for v in victims if v.get('has_disability'))}")

    # Disaster zones
    ctx_parts.append(f"\nDISASTER ZONES ({len(zones)} active):")
    for z in zones:
        ctx_parts.append(
            f"  - {z.get('name','?')} | Type: {z.get('disaster_type','?')} | "
            f"Risk: {z.get('risk_level','?')} | Affected: {z.get('affected_population',0)}"
        )

    return "\n".join(ctx_parts)


async def get_rescue_bot_response(
    message: str,
    history: List[Dict],
    app_data: Dict,
    allocation_callback=None,
) -> Dict:
    """Generate RescueBot response using Gemini API or fallback"""

    context = build_context(app_data)

    # Check if Gemini API is available
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                "gemini-1.5-flash",
                system_instruction=SYSTEM_PROMPT,
            )

            # Build history for multi-turn
            chat_history = []
            for msg in history[-10:]:  # last 10 turns
                chat_history.append({
                    "role": msg.get("role", "user"),
                    "parts": [msg.get("content", "")]
                })

            chat = model.start_chat(history=chat_history)
            full_msg = f"{context}\n\nUSER QUESTION: {message}"
            response = chat.send_message(full_msg)
            reply = response.text

            sources = _extract_sources(message, app_data)
            return {
                "reply": reply,
                "sources": sources,
                "action_taken": None,
                "requires_approval": _requires_approval(message),
            }
        except Exception as e:
            # Fallback to rule-based
            return _rule_based_response(message, app_data, str(e))
    else:
        return _rule_based_response(message, app_data)


def _rule_based_response(message: str, app_data: Dict, error: str = None) -> Dict:
    """Intelligent rule-based fallback when no LLM key is configured"""
    msg_lower = message.lower()
    shelters = app_data.get("shelters", [])
    victims  = app_data.get("victims", [])
    stats    = app_data.get("stats", {})
    zones    = app_data.get("disaster_zones", [])

    reply = ""
    sources = []
    requires_approval = False

    if any(w in msg_lower for w in ["safest shelter", "best shelter", "find shelter"]):
        safe = sorted(
            [s for s in shelters if s.get("status") == "operational" and s.get("available_capacity", 0) > 0],
            key=lambda x: x.get("risk_score", 1.0)
        )
        if safe:
            top = safe[0]
            reply = (
                f"🏠 **Safest Available Shelter:**\n\n"
                f"**{top['name']}** ({top['shelter_id']})\n"
                f"- Risk Score: {top['risk_score']:.2f} (lowest available)\n"
                f"- Available Capacity: {top['available_capacity']} spaces\n"
                f"- Medical Facilities: {'✅ Yes' if top.get('has_medical') else '❌ No'}\n"
                f"- Accessibility: {'✅ Yes' if top.get('is_accessible') else '❌ No'}\n"
                f"- Status: {top['status'].upper()}\n\n"
                f"*Based on current shelter data from RESCUE AI database.*"
            )
            sources = [{"type": "shelter", "id": top["shelter_id"], "name": top["name"]}]
        else:
            reply = "⚠️ No safe shelters with available capacity found in the current database."

    elif any(w in msg_lower for w in ["medical", "medical facility", "medical facilities"]):
        medical = [s for s in shelters if s.get("has_medical") and s.get("status") == "operational"]
        if medical:
            reply = f"🏥 **Shelters with Medical Facilities ({len(medical)} found):**\n\n"
            for s in medical[:5]:
                reply += f"- **{s['name']}** ({s['shelter_id']}): {s.get('available_capacity',0)} spaces available\n"
            sources = [{"type": "shelter", "id": s["shelter_id"], "name": s["name"]} for s in medical[:5]]
        else:
            reply = "No shelters with medical facilities are currently operational."

    elif any(w in msg_lower for w in ["overcrowded", "full", "capacity"]):
        full = [s for s in shelters if s.get("occupancy_pct", 0) >= 80]
        reply = f"⚠️ **Overcrowded/Near-Capacity Shelters ({len(full)} found):**\n\n"
        for s in full[:5]:
            reply += f"- **{s['name']}** ({s['shelter_id']}): {s.get('occupancy_pct',0):.0f}% occupied\n"
        if not full:
            reply = "✅ No shelters are currently overcrowded."

    elif any(w in msg_lower for w in ["statistics", "stats", "overview", "summary"]):
        reply = (
            f"📊 **RESCUE AI System Overview (Simulated Data):**\n\n"
            f"- 👥 Total Affected Population: {stats.get('total_affected', 0):,}\n"
            f"- 📋 Registered Victims: {stats.get('registered_victims', 0):,}\n"
            f"- 🏠 Active Shelters: {stats.get('active_shelters', 0)}\n"
            f"- 📦 Total Capacity: {stats.get('total_capacity', 0):,}\n"
            f"- ✅ Available Spaces: {stats.get('available_spaces', 0):,}\n"
            f"- 📈 Occupancy: {stats.get('occupancy_pct', 0):.1f}%\n"
            f"- 🔴 High-Risk Zones: {stats.get('high_risk_zones', 0)}\n"
            f"- ✅ Successfully Allocated: {stats.get('successful_allocations', 0):,}"
        )

    elif any(w in msg_lower for w in ["risk", "highest risk", "dangerous"]):
        risky = sorted(shelters, key=lambda x: -x.get("risk_score", 0))[:5]
        reply = "🚨 **Highest Risk Shelters:**\n\n"
        for s in risky:
            reply += f"- **{s['name']}** ({s['shelter_id']}): Risk score {s.get('risk_score',0):.2f}\n"
        sources = [{"type": "shelter", "id": s["shelter_id"], "name": s["name"]} for s in risky]

    elif any(w in msg_lower for w in ["csp", "backtracking", "bayesian", "algorithm", "compare"]):
        reply = (
            "🤖 **AI Algorithm Comparison:**\n\n"
            "**CSP (Constraint Satisfaction Problem)**\n"
            "- Enforces hard constraints (capacity, safety, medical, accessibility)\n"
            "- Uses weighted scoring to rank shelter assignments\n"
            "- Optimal for systematic, rule-based allocation\n\n"
            "**Backtracking Search**\n"
            "- Exhaustively explores assignment combinations\n"
            "- Backtracks when a constraint is violated\n"
            "- Guarantees a valid solution if one exists\n\n"
            "**Bayesian Reasoning**\n"
            "- Computes P(safe | evidence) for each shelter\n"
            "- Accounts for uncertainty and updates with new evidence\n"
            "- Best for probabilistic risk assessment\n\n"
            "**Multi-Agent System**\n"
            "- 6 specialized agents coordinate collaboratively\n"
            "- Each agent focuses on a domain (location, safety, medical, etc.)\n"
            "- Coordinator resolves conflicts and produces final plan\n\n"
            "Use the **AI Allocation Engine** module to run any of these algorithms live."
        )

    elif any(w in msg_lower for w in ["allocate", "assign"]):
        requires_approval = True
        reply = (
            "⚡ **Allocation Request Detected**\n\n"
            "To run a live allocation, please use the **AI Allocation Engine** module. "
            "It will execute the full CSP algorithm and display results with explanations.\n\n"
            "For chatbot-triggered allocation, administrator approval is required. "
            "Would you like me to prepare an allocation request for review?\n\n"
            "*Note: RescueBot does not modify allocation records without explicit admin approval.*"
        )

    elif any(w in msg_lower for w in ["disaster", "flood", "earthquake", "cyclone", "wildfire"]):
        reply = f"🌪️ **Active Disaster Zones ({len(zones)} total):**\n\n"
        for z in zones:
            reply += (
                f"- **{z.get('name','?')}** | Type: {z.get('disaster_type','?').upper()} | "
                f"Risk: {z.get('risk_level','?').upper()} | Affected: {z.get('affected_population',0):,} people\n"
            )

    else:
        reply = (
            "👋 Hello! I'm **RescueBot AI**, your RESCUE AI assistant.\n\n"
            "I can help you with:\n"
            "- 🏠 Finding safe shelters and checking capacity\n"
            "- 📊 System statistics and overview\n"
            "- 🏥 Identifying shelters with medical facilities\n"
            "- ⚠️ Checking high-risk or overcrowded shelters\n"
            "- 🤖 Explaining AI allocation algorithms\n"
            "- 🌪️ Summarizing active disaster zones\n\n"
            "Try asking: *'Find the safest available shelter'* or *'Which shelters have medical facilities?'*\n\n"
            + (f"*(Note: Running in demo mode — Gemini API not configured: {error})*" if error else "")
        )

    return {
        "reply": reply,
        "sources": sources,
        "action_taken": None,
        "requires_approval": requires_approval,
    }


def _extract_sources(message: str, app_data: Dict) -> List[Dict]:
    """Extract relevant data sources cited in the response"""
    sources = []
    shelters = app_data.get("shelters", [])
    for s in shelters[:3]:
        if s.get("shelter_id", "").lower() in message.lower() or s.get("name", "").lower() in message.lower():
            sources.append({"type": "shelter", "id": s["shelter_id"], "name": s["name"]})
    return sources

def _requires_approval(message: str) -> bool:
    action_words = ["allocate", "assign", "move", "transfer", "close shelter", "update"]
    return any(w in message.lower() for w in action_words)
