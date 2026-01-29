from datetime import datetime
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from app.models import Case, CaseExhibit, Transaction, Entity, ExhibitStatus
import google.generativeai as genai
from app.core.config import settings

class InterrogationEngine:
    """
    Automates the preparation for witness and suspect interviews.
    Synthesizes case evidence into a structured interrogation guide.
    """
    
    @staticmethod
    async def generate_guide(db: Session, case_id: str) -> Dict[str, Any]:
        case = db.get(Case, case_id)
        if not case:
            return {"error": "Case not found"}
            
        # 1. Fetch Admitted Evidence
        exhibits = db.exec(
            select(CaseExhibit).where(
                CaseExhibit.case_id == case_id, 
                CaseExhibit.verdict == ExhibitStatus.ADMITTED
            )
        ).all()
        
        evidence_summary = []
        for ex in exhibits:
            evidence_summary.append(f"- [{ex.evidence_type.upper()}] {ex.label}: (ID: {ex.evidence_id})")
            if ex.ai_contradiction_note:
                evidence_summary.append(f"  * Conflict: {ex.ai_contradiction_note}")

        # 2. Construct Prompt for Gemini
        prompt = f"""
You are a Lead Forensic Interrogator. 
Prepare an interrogation guide for Case: {case.title}
Evidence Admitted:
{chr(10).join(evidence_summary)}

Structure the response as a formal document with:
1. THEME: The central psychological leverage point.
2. LINE OF QUESTIONING: 5-7 progressive questions intended to lead to admission of guilt.
3. EXHIBIT PRESENTATION: Which evidence ID to show at which point for "maximum impact".
4. CONTRADICTION TRAPS: Specific inconsistencies the suspect might try to explain away.

Tone: Professional, clinical, and high-pressure.
"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(prompt)
        
        return {
            "case_id": case_id,
            "title": f"Interrogation Strategy: {case.title}",
            "generated_at": str(datetime.utcnow()),
            "guide_content": response.text,
            "evidence_count": len(exhibits)
        }
