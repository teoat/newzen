"""
Vision Service for OCR and visual analysis of documents.
Leverages Gemini's multimodal capabilities.
"""
from typing import Dict, Any
import base64
from sqlmodel import Session
from app.modules.ai.frenly_orchestrator import FrenlyOrchestrator


class VisionService:
    def __init__(self, db: Session):
        self.db = db
        self.orchestrator = FrenlyOrchestrator(db)

    async def analyze_invoice(
        self,
        image_path: str
    ) -> Dict[str, Any]:
        """
        Extract structured data from invoice/receipt images.
        
        Returns transaction details, vendor info, and line items.
        """
        # Read image file
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        # Encode to base64
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        prompt = """
Analyze this invoice/receipt image forensically.

Extract and return JSON:
{
  "vendor_name": "...",
  "invoice_number": "...",
  "date": "YYYY-MM-DD",
  "total_amount": 0.0,
  "currency": "IDR",
  "line_items": [
    {
      "description": "...",
      "quantity": 0,
      "unit_price": 0.0,
      "total": 0.0
    }
  ],
  "forensic_notes": [
    "Any suspicious alterations, inconsistencies, or red flags"
  ]
}

Be thorough. Flag any signs of manipulation, whiteout, or mismatched totals.
"""
        
        try:
            # Use Gemini's vision capabilities
            import google.generativeai as genai
            from app.core.config import settings
            
            model = genai.GenerativeModel(settings.MODEL_PRO)
            response = model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_b64}
            ])
            
            # Parse JSON response
            import re
            import json
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except Exception as e:
            print(f"Invoice analysis failed: {e}")
        
        return {
            "error": "Could not analyze invoice",
            "forensic_notes": ["Analysis failed - manual review required"]
        }

    async def analyze_bank_statement(
        self,
        pdf_path: str
    ) -> Dict[str, Any]:
        """
        Extract transactions from bank statement PDF.
        """
        # For PDFs, we'd need to convert to images first
        # or use direct PDF parsing with Gemini
        
        
        try:
            # Read PDF and process
            # This would require PyPDF2 or similar
            # For now, return template
            return {
                "account_number": "PENDING_OCR",
                "transactions": [],
                "forensic_flags": [
                    "PDF OCR not yet implemented - upload as images"
                ]
            }
        except Exception as e:
            print(f"Statement analysis failed: {e}")
            return {"error": str(e)}

    async def count_objects_in_site_photo(
        self,
        image_path: str,
        object_type: str = "excavator"
    ) -> Dict[str, Any]:
        """
        Count specific objects in construction site photos.
        
        Args:
            image_path: Path to site photo
            object_type: What to count (e.g., "excavator", "concrete bags")
            
        Returns:
            Count and confidence metrics
        """
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        prompt = f"""
Analyze this construction site photo.

Task: Count the number of {object_type} visible in the image.

Return JSON:
{{
  "object_type": "{object_type}",
  "count": 0,
  "confidence": 0.0-1.0,
  "observations": [
    "Detailed notes about what you see"
  ],
  "quality_issues": [
    "List any issues: blur, occlusion, poor lighting, etc."
  ]
}}

Be conservative. If uncertain, note it in observations.
"""
        
        try:
            import google.generativeai as genai
            
            from app.core.config import settings
            model = genai.GenerativeModel(settings.MODEL_PRO)
            response = model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_b64}
            ])
            
            import re
            import json
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except Exception as e:
            print(f"Object counting failed: {e}")
            return {
                "object_type": object_type,
                "count": 0,
                "confidence": 0.0,
                "observations": [f"Analysis failed: {e}"]
            }

    async def detect_photo_manipulation(
        self,
        image_path: str
    ) -> Dict[str, Any]:
        """
        Check for signs of photo editing or forgery.
        """
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        prompt = """
Perform forensic analysis on this image for signs of manipulation.

Check for:
1. Clone stamp artifacts
2. Inconsistent lighting/shadows
3. EXIF metadata anomalies
4. Compression artifacts
5. Color banding

Return JSON:
{
  "authenticity_score": 0.0-1.0,
  "manipulation_detected": true/false,
  "findings": [
    "List specific evidence of manipulation"
  ],
  "exif_warnings": [
    "Any suspicious metadata"
  ]
}
"""
        
        try:
            import google.generativeai as genai
            
            from app.core.config import settings
            model = genai.GenerativeModel(settings.MODEL_PRO)
            response = model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_b64}
            ])
            
            import re
            import json
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except Exception as e:
            print(f"Manipulation detection failed: {e}")
        
        return {
            "authenticity_score": 0.5,
            "manipulation_detected": False,
            "findings": ["Analysis inconclusive"]
        }
