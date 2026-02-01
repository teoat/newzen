import os
from typing import List
from sqlmodel import Session, select
from app.models import Document
from app.core.db import engine
import google.generativeai as genai
from app.core.config import settings

class RAGService:
    def __init__(self):
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.vision_model = genai.GenerativeModel(settings.MODEL_PRO)

    def process_file_content(self, content: bytes, file_type: str) -> str:
        """Process raw bytes based on file type (PDF, Images, etc.)"""
        if file_type in ["image", "photo", "jpg", "png"]:
            return self._analyze_image_visuals(content)
        
        # Fallback to string decoding if text-based
        try:
            return content.decode("utf-8", errors="ignore")
        except Exception:
            return "[Binary Content]"

    def _analyze_image_visuals(self, content: bytes) -> str:
        """Uses Gemini Vision to perform forensic visual indexing."""
        prompt = """
        You are a forensic evidence analyzer. 
        Analyze this image and provide a detailed visual index including:
        1. Objects detected (e.g. 'cement bags', 'steel rebar', 'handwritten receipt').
        2. Text found within the image (OCR).
        3. Forensic red flags (e.g. 'unusual signatures', 'date alterations', 'site discrepancies').
        
        Respond with a detailed descriptive narrative for RAG indexing.
        """
        
        image_parts = [
            {"mime_type": "image/jpeg", "data": content}
        ]
        
        try:
            response = self.vision_model.generate_content([prompt, image_parts[0]])
            return response.text.strip()
        except Exception as e:
            return f"Visual Analysis Failed: {str(e)}"

    def ingest_text(self, text: str, doc_id: str, metadata: dict = None):
        """Ingests text into the system for later retrieval."""

    def query_context(
        self,
        query: str,
        project_id: str = None,
        limit: int = 3
    ) -> List[Document]:
        """
        Retrieves documents relevant to the query.
        """
        with Session(engine) as session:
            # Build query with security filter
            statement = select(Document).where(
                Document.content_text.contains(query)
            )
            
            # CRITICAL: Filter by project_id for multi-tenant isolation
            if project_id:
                statement = statement.where(Document.project_id == project_id)
            
            statement = statement.limit(limit)
            results = session.exec(statement).all()
            return results

    def process_file(self, file_path: str, file_type: str) -> str:
        """Extracts text from various file types (PDF, Images, etc.)"""
        
        if not os.path.exists(file_path):
            return f"File not found: {file_path}"
            
        with open(file_path, "rb") as f:
            content = f.read()
            
        return self.process_file_content(content, file_type)


rag_service = RAGService()
