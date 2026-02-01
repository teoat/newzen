
"""
Data Hospital Service.
The 'ICU' for failed data rows.
Uses LLMs (or regex heuristics) to repair malformed data.
"""
from typing import Dict, Any
from sqlmodel import Session
import json
import re
from app.models import QuarantineRow

class DataHospital:
    def __init__(self, db: Session):
        self.db = db

    def admit_patient(self, project_id: str, raw_content: str, error_msg: str, row_index: int) -> QuarantineRow:
        """Create a new QuarantineRow entry."""
        patient = QuarantineRow(
            project_id=project_id,
            raw_content=raw_content,
            error_message=error_msg,
            row_index=row_index,
            status="new"
        )
        self.db.add(patient)
        self.db.commit()
        self.db.refresh(patient)
        return patient

    async def shift_rounds(self, patient: QuarantineRow) -> Dict[str, Any]:
        """
        The 'Nurse' logic. Attempts to diagnose and fix the row.
        """
        fix_proposal = {}
        fixed = False
        
        # 1. Common Symptom: JSON formatting error (single vs double quotes)
        if "json" in patient.error_message.lower():
            try:
                # Try replacing single quotes with double quotes
                corrected = patient.raw_content.replace("'", '"')
                json.loads(corrected)
                fix_proposal = {"method": "json_quote_fix", "content": corrected}
                fixed = True
            except Exception:
                pass

        # 2. Common Symptom: Date Format
        if not fixed and "date" in patient.error_message.lower():
            # Try capturing YYYY-MM-DD
            match = re.search(r'\d{4}-\d{2}-\d{2}', patient.raw_content)
            if match:
                fix_proposal = {"method": "date_extraction", "date_found": match.group(0)}
                fixed = True

        # 3. Last Resort: LLM Surgery (Simulated for V3 MVP)
        if not fixed:
            # Here we would call Gemini to "Repair this JSON string"
            fix_proposal = {"method": "manual_review_needed", "note": "Too complex for heuristics"}
        
        # Update Patient Chart
        patient.suggested_fix = fix_proposal
        patient.status = "repaired" if fixed else "needs_specialist"
        self.db.add(patient)
        self.db.commit()
        
        return fix_proposal
