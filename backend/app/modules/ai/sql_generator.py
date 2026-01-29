"""
Gemini-Powered SQL Generator for Frenly AI
Uses Google Gemini 2.5 Flash for intelligent Text-to-SQL conversion
with schema awareness and context understanding.
"""

from typing import Dict, Any, Optional
from sqlmodel import Session
import google.generativeai as genai
from app.core.config import settings
import json

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiSQLGenerator:
    """
    Advanced SQL generator using Gemini 2.5 Flash.
    Generates safe, optimized SQL queries from natural language.
    """

    def __init__(self, db: Session):
        self.db = db
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
        # Database schema for context
        self.schema = self._get_database_schema()

    def _get_database_schema(self) -> Dict[str, Any]:
        """
        Extract database schema for Gemini context.
        """
        return {
            "transaction": {
                "description": "Main transaction table from accounting ledger",
                "columns": {
                    "id": "TEXT PRIMARY KEY",
                    "project_id": "TEXT (FK to project.id)",
                    "transaction_date": "DATE",
                    "description": "TEXT",
                    "amount": "REAL (in IDR)",
                    "sender": "TEXT (payer/source entity)",
                    "receiver": "TEXT (payee/destination entity)",
                    "category": "TEXT (expense category)",
                    "risk_score": "REAL (0.0-1.0, higher = riskier)",
                    "forensic_triggers": "JSON (detected anomalies)",
                    "created_at": "TIMESTAMP",
                },
                "indexes": ["project_id", "transaction_date", "risk_score"],
            },
            "bank_transaction": {
                "description": "Bank statement transactions for reconciliation",
                "columns": {
                    "id": "TEXT PRIMARY KEY",
                    "project_id": "TEXT",
                    "date": "DATE",
                    "description": "TEXT",
                    "debit": "REAL",
                    "credit": "REAL",
                    "balance": "REAL",
                    "reference": "TEXT",
                },
            },
            "entity": {
                "description": "Entities (vendors, contractors, etc.)",
                "columns": {
                    "id": "TEXT PRIMARY KEY",
                    "name": "TEXT (entity name)",
                    "entity_type": "TEXT (vendor, contractor, government)",
                    "tax_id": "TEXT",
                    "risk_level": "TEXT (low, medium, high)",
                },
            },
            "project": {
                "description": "Audit projects",
                "columns": {
                    "id": "TEXT PRIMARY KEY",
                    "name": "TEXT",
                    "contractor_name": "TEXT",
                    "contract_value": "REAL",
                    "start_date": "DATE",
                    "end_date": "DATE",
                    "status": "TEXT",
                },
            },
        }

    async def generate_from_natural_language(
        self,
        query: str,
        project_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate SQL from natural language using Gemini 2.5 Flash.
        """
        context = context or {}
        session_id = context.get("session_id", "default")
        from app.core.redis_client import redis_client

        history = redis_client.get_history(session_id)
        history_text = "\n".join([f"{m['role']}: {m['text']}" for m in history[-5:]])

        prompt = f"""
You are an expert SQL generator for a forensic audit database.
DATABASE SCHEMA:
{json.dumps(self.schema, indent=2)}

RECENT CONVERSATION:
{history_text}

USER QUERY: "{query}"
CONTEXT:
- Current Project ID: {project_id or 'Not specified'}
- Page: {context.get('page', 'Unknown')}
- Additional Filters: {context.get('filters', {})}
IMPORTANT RULES:
1. Generate ONLY SELECT queries (no INSERT/UPDATE/DELETE/DROP)
2. Always include WHERE project_id = '{project_id}' if project_id is provided
3. Use appropriate JOINs when querying multiple tables
4. Add LIMIT 100 to prevent overwhelming results
5. Use proper date formatting: DATE('YYYY-MM-DD')
6. For time ranges, use created_at or transaction_date
7. Map natural language amounts to the amount column (in IDR)
8. For "high risk" queries, use risk_score > 0.7
9. For "suspicious" patterns, check forensic_triggers JSON column
EXAMPLES:
- "Show me high-risk transactions" → WHERE risk_score > 0.7
- "Transactions above 100M last month" → WHERE amount > 100000000 AND transaction_date >= DATE('now', '-1 month')
- "All vendors who received payments" → SELECT DISTINCT receiver FROM transaction WHERE receiver IS NOT NULL
Respond in JSON format:
{{
  "sql": "SELECT ... (the valid SQL query)",
  "explanation": "What this query does",
  "confidence": 0.95 (0.0-1.0),
  "assumptions": ["any assumptions made"]
}}
"""
        try:
            response = self.model.generate_content(prompt)
            result = json.loads(response.text)
            # Validate SQL before returning
            sql = result.get("sql", "")
            if not self._is_safe_sql(sql):
                return {
                    "success": False,
                    "error": "Generated SQL failed safety checks",
                    "sql": sql,
                }
            return {
                "success": True,
                "sql": sql,
                "explanation": result.get("explanation", ""),
                "confidence": result.get("confidence", 0.8),
                "assumptions": result.get("assumptions", []),
            }
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "Failed to parse Gemini response as JSON",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"SQL generation failed: {str(e)}",
            }

    def _is_safe_sql(self, sql: str) -> bool:
        """
        Validate that SQL is safe to execute.
        Prevents destructive operations.
        """
        sql_upper = sql.upper().strip()
        # Blocked keywords
        dangerous_keywords = [
            "DROP",
            "DELETE",
            "TRUNCATE",
            "INSERT",
            "UPDATE",
            "ALTER",
            "CREATE",
            "GRANT",
            "REVOKE",
            "EXEC",
            "EXECUTE",
        ]
        for keyword in dangerous_keywords:
            if keyword in sql_upper:
                return False
        # Must start with SELECT
        if not sql_upper.startswith("SELECT"):
            return False
        return True

    async def explain_query_results(self, sql: str, results: list, original_query: str) -> str:
        """
        Generate human-readable explanation of SQL results.
        """
        sample_results = results[:3] if len(results) > 3 else results
        prompt = f"""
Explain the results of this database query to an auditor.
ORIGINAL QUESTION: "{original_query}"
SQL QUERY: {sql}
RESULTS: {len(results)} rows returned
SAMPLE DATA: {json.dumps(sample_results, default=str)}
Provide a 2-3 sentence summary highlighting:
- What was found
- Key statistics (totals, averages, counts)
- Any notable patterns or anomalies
Be concise and actionable.
"""
        response = self.model.generate_content(prompt)
        return response.text

    async def suggest_follow_up_queries(self, current_query: str, results: list) -> list[str]:
        """
        Suggest logical follow-up questions based on results.
        """
        prompt = f"""
Based on the query and results, suggest 3 follow-up questions an auditor might ask.
CURRENT QUERY: "{current_query}"
RESULTS COUNT: {len(results)}
Suggest 3 natural language follow-up questions.
Keep them concise and relevant to forensic auditing.
Respond as JSON array: ["question 1", "question 2", "question 3"]
"""
        try:
            response = self.model.generate_content(prompt)
            suggestions = json.loads(response.text)
            return suggestions if isinstance(suggestions, list) else []
        except Exception:
            return []
