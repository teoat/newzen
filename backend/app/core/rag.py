import os
from typing import List
from sqlmodel import Session, select
from app.models import Document
from app.core.db import engine


class RAGService:
    def __init__(self):
        # Placeholder for embedding model
        pass

    def ingest_text(self, text: str, doc_id: str, metadata: dict = None):
        """Ingests text into the system for later retrieval."""

    def query_context(self, query: str, limit: int = 3) -> List[Document]:
        """Retrieves documents relevant to the query."""
        with Session(engine) as session:
            statement = select(Document).where(Document.content_text.contains(query)).limit(limit)
            results = session.exec(statement).all()
            return results

    def process_file(self, file_path: str, file_type: str) -> str:
        """Extracts text from various file types (PDF, Images, etc.)"""
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        if file_type == "pdf" or ext == ".pdf":
            try:
                from pypdf import PdfReader

                reader = PdfReader(file_path)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            except Exception as e:
                text = f"Error extracting PDF: {str(e)}"
        elif file_type in ["image", "photo"]:
            text = f"[Image Content Analysis for {os.path.basename(file_path)}]"
        elif file_type == "video":
            text = f"[Video Transcription for {os.path.basename(file_path)}]"
        elif file_type == "chat":
            text = "[Chat History Record]"
        return text


rag_service = RAGService()
