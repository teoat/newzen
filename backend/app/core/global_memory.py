import numpy as np
from sqlmodel import Session, select
from typing import List, Dict, Any
from app.models import CopilotInsight, Entity
import google.generativeai as genai
from app.core.config import settings

class GlobalMemoryService:
    """
    V6: Organization-wide Forensic Memory.
    Indexes findings across all projects to detect recidivism and shared patterns.
    """
    
    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """Generate embedding using Gemini."""
        if not settings.GEMINI_API_KEY:
            return [0.0] * 768 # Dummy
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']

    @staticmethod
    def find_recidivist_entities(db: Session, entity_name: str) -> List[Dict[str, Any]]:
        """Find if an entity has high-risk history in other projects."""
        entities = db.exec(
            select(Entity).where(Entity.name == entity_name, Entity.risk_score > 0.5)
        ).all()
        
        history = []
        for ent in entities:
            history.append({
                "project_id": ent.project_id,
                "risk_score": ent.risk_score,
                "type": ent.type,
                "is_watchlisted": ent.is_watchlisted
            })
        return history

    @staticmethod
    def find_similar_cases(db: Session, current_finding: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Perform semantic search across all projects to find similar fraud patterns.
        In a full pgvector setup, this would be a single SQL query.
        Here we use manual cosine similarity for SQLite compatibility.
        """
        current_vec = GlobalMemoryService.get_embedding(current_finding)
        all_insights = db.exec(select(CopilotInsight)).all()
        
        results = []
        for insight in all_insights:
            if not insight.embeddings_json: continue
            
            # Cosine Similarity
            vec_a = np.array(current_vec)
            vec_b = np.array(insight.embeddings_json)
            norm_a = np.linalg.norm(vec_a)
            norm_b = np.linalg.norm(vec_b)
            
            if norm_a == 0 or norm_b == 0: continue
            
            similarity = np.dot(vec_a, vec_b) / (norm_a * norm_b)
            
            if similarity > 0.8: # Threshold
                results.append({
                    "title": insight.title,
                    "content": insight.content,
                    "project_id": insight.project_id,
                    "similarity": float(similarity)
                })
        
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]
