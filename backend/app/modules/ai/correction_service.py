from typing import List, Dict, Any, Optional
from sqlmodel import Session, select
from app.models import AICorrection, Transaction
from datetime import datetime, UTC
import google.generativeai as genai
from app.core.config import settings

class AICorrectionService:
    def __init__(self, db: Session):
        self.db = db

    def submit_correction(
        self,
        project_id: str,
        investigator_id: str,
        entity_type: str,
        entity_id: str,
        original_verdict: str,
        corrected_verdict: str,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AICorrection:
        """
        Records a human investigator's correction of an AI finding.
        Enables Active Learning by providing "Gold Standard" examples.
        """
        correction = AICorrection(
            project_id=project_id,
            investigator_id=investigator_id,
            entity_type=entity_type,
            entity_id=entity_id,
            original_ai_verdict=original_verdict,
            corrected_verdict=corrected_verdict,
            correction_reason=reason,
            metadata_json=metadata or {}
        )
        
        # Generate embedding for the correction reason to allow semantic retrieval
        try:
            # We use the same model as RAG for consistency
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=f"{entity_type} {corrected_verdict}: {reason}",
                task_type="retrieval_document"
            )
            correction.embeddings_json = result['embedding']
        except Exception as e:
            print(f"Failed to generate correction embedding: {e}")

        self.db.add(correction)
        self.db.commit()
        self.db.refresh(correction)
        return correction

    def get_relevant_corrections(self, project_id: str, context_text: str, limit: int = 5) -> List[AICorrection]:
        """
        Retrieves human corrections that are semantically relevant to the current task.
        Used to ground AI reasoning in past investigator decisions.
        """
        # In this lite version, we fallback to project-specific latest corrections
        # In full version, this uses vector similarity on embeddings_json
        statement = select(AICorrection).where(
            AICorrection.project_id == project_id
        ).order_by(AICorrection.created_at.desc()).limit(limit)
        
        return self.db.exec(statement).all()
