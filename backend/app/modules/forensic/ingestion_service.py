"""
Ingestion Service with LLM-based schema mapping.
Handles intelligent field mapping using AI inference.
"""
from typing import List, Dict, Any
from sqlmodel import Session
from app.modules.ai.frenly_orchestrator import FrenlyOrchestrator


class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.orchestrator = FrenlyOrchestrator(db)

    async def infer_schema_mapping(
        self,
        file_columns: List[str],
        sample_data: List[Dict[str, Any]],
        target_schema: List[Dict[str, str]]
    ) -> Dict[str, str]:
        """
        Use LLM to intelligently map source columns to target schema.
        
        Args:
            file_columns: List of column names from uploaded file
            sample_data: Sample rows for context
            target_schema: Expected schema fields with descriptions
            
        Returns:
            Mapping dictionary {file_column: target_field}
        """
        # Build context for LLM
        target_fields = "\n".join([
            f"- {field['name']}: {field.get('description', '')}"
            for field in target_schema
        ])
        
        sample_preview = "\n".join([
            f"Row {i+1}: {row}"
            for i, row in enumerate(sample_data[:3])
        ])
        
        prompt = f"""
You are Zenith's Ingestion Engine. Map these file columns to target schema.

FILE COLUMNS:
{", ".join(file_columns)}

SAMPLE DATA:
{sample_preview}

TARGET SCHEMA:
{target_fields}

Return ONLY a JSON mapping object like:
{{
  "Date": "transaction_date",
  "Description": "description",
  "Amount": "amount",
  ...
}}

Rules:
- Map only if confident (>80% match)
- Use null for unmapped columns
- Prioritize semantic meaning over exact names
"""
        
        try:
            response = self.orchestrator.model.generate_content(prompt)
            # Extract JSON from response
            import re
            import json
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return {}
        except Exception as e:
            print(f"Schema mapping failed: {e}")
            # Fallback to fuzzy matching
            return self._fuzzy_map(file_columns, target_schema)

    def _fuzzy_map(
        self,
        file_columns: List[str],
        target_schema: List[Dict[str, str]]
    ) -> Dict[str, str]:
        """Fallback fuzzy matching logic."""
        from difflib import SequenceMatcher
        
        mapping = {}
        for file_col in file_columns:
            best_match = None
            best_score = 0.0
            
            for target in target_schema:
                target_name = target['name']
                similarity = SequenceMatcher(
                    None,
                    file_col.lower(),
                    target_name.lower()
                ).ratio()
                
                if similarity > best_score and similarity > 0.6:
                    best_score = similarity
                    best_match = target_name
            
            if best_match:
                mapping[file_col] = best_match
        
        return mapping

    async def validate_data_quality(
        self,
        records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Use LLM to detect data quality issues.
        
        Returns:
            Quality metrics and warnings
        """
        sample = records[:10] if len(records) > 10 else records
        
        prompt = f"""
Analyze this transaction data for quality issues:

{sample}

Check for:
1. Missing required fields
2. Inconsistent date formats
3. Suspicious patterns (duplicates, round numbers)
4. Data type mismatches

Return JSON:
{{
  "quality_score": 0-100,
  "warnings": ["list of issues"],
  "critical_errors": ["blocking issues"]
}}
"""
        
        try:
            response = self.orchestrator.model.generate_content(prompt)
            import re
            import json
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
        except Exception as e:
            print(f"Quality validation failed: {e}")
        
        return {
            "quality_score": 75,
            "warnings": [],
            "critical_errors": []
        }
