"""
Frenly AI Meta-Agent Orchestrator
Unified backend for intelligent forensic assistance using Gemini 2.5 Flash.
Handles intent detection, SQL execution, and proactive monitoring.
"""

from typing import Dict, List, Any, Optional, Literal
from datetime import datetime, timedelta
from sqlmodel import Session, select, desc
import json
import google.generativeai as genai
from app.core.config import settings
from app.models import Transaction, FraudAlert
from app.modules.ai.sql_generator import GeminiSQLGenerator
from app.modules.ai.narrative_service import NarrativeEngine
from app.core.redis_client import get_history
from app.core.global_memory import GlobalMemoryService

# Configure Gemini with 2.5 Flash
genai.configure(api_key=settings.GEMINI_API_KEY)


class FrenlyOrchestrator:
    """
    Main orchestration layer for Frenly AI.
    Routes queries to appropriate handlers based on detected intent.
    """

    def __init__(self, db: Session):
        self.db = db
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
        self.sql_generator = GeminiSQLGenerator(db)
        self.narrative_engine = NarrativeEngine()

    def detect_intent(
        self, query: str, context: Dict[str, Any]
    ) -> Literal["sql_query", "action", "explanation", "general_chat"]:
        """
        Use Gemini 2.5 Flash to classify user intent with high accuracy.
        """
        prompt = f"""
You are an intent classifier for a forensic audit system.
User Query: "{query}"
Current Page: {context.get('page', 'unknown')}
Project ID: {context.get('project_id', 'none')}
Classify the intent into ONE of these categories:
1. sql_query - User wants to query/analyze transaction data
2. action - User wants to perform an action (export, create case, etc.)
3. explanation - User wants an explanation of a concept/result
4. general_chat - General conversation or greeting
Examples:
- "Show me transactions above 100M" → sql_query
- "Export this to PDF" → action
- "Why is this flagged as high risk?" → explanation
- "Hello, how are you?" → general_chat
Respond with ONLY ONE WORD: sql_query, action, explanation, or general_chat
"""
        response = self.model.generate_content(prompt)
        intent = response.text.strip().lower()
        # Validate response
        valid_intents = ["sql_query", "action", "explanation", "general_chat"]
        return intent if intent in valid_intents else "general_chat"

    async def handle_sql_query(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate and execute SQL query, then explain results using Gemini.
        """
        project_id = context.get("project_id")
        # Generate SQL using enhanced generator
        sql_result = await self.sql_generator.generate_from_natural_language(
            query=query, project_id=project_id, context=context
        )
        if not sql_result["success"]:
            return {
                "response_type": "error",
                "answer": f"I couldn't generate a valid SQL query. {sql_result.get('error', '')}",
                "sql": None,
                "data": [],
                "suggested_actions": [],
            }
        # Execute SQL
        try:
            result = self.db.execute(sql_result["sql"])
            data = [dict(row._mapping) for row in result.fetchall()]
            # Generate explanation using Gemini
            explanation = await self._explain_sql_results(query, sql_result["sql"], data)
            # Suggest follow-up actions
            actions = self._suggest_actions_from_results(data, context)
            return {
                "response_type": "sql_query",
                "answer": explanation,
                "sql": sql_result["sql"],
                "data": data,
                "suggested_actions": actions,
                "confidence": sql_result.get("confidence", 0.9),
            }
        except Exception as e:
            return {
                "response_type": "error",
                "answer": f"Query execution failed: {str(e)}",
                "sql": sql_result["sql"],
                "data": [],
                "suggested_actions": [],
            }

    async def handle_action(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute forensic actions based on user request.
        Uses Gemini function calling to determine which action to perform.
        """
        # Define available actions
        actions_schema = {
            "export_report": {
                "description": "Export data to PDF/Excel/CSV",
                "parameters": {
                    "format": "pdf|excel|csv",
                    "data_type": "transactions|entities|cases",
                },
            },
            "create_case": {
                "description": "Create a new investigation case",
                "parameters": {"title": "str", "priority": "high|medium|low"},
            },
            "flag_transaction": {
                "description": "Flag a transaction for review",
                "parameters": {
                    "transaction_id": "str",
                    "reason": "str",
                },
            },
            "generate_dossier": {
                "description": "Generate forensic dossier for an entity",
                "parameters": {"entity_name": "str", "format": "pdf|docx"},
            },
        }
        prompt = f"""
You are an action executor for a forensic audit system.
User Request: "{query}"
Context: {json.dumps(context)}
Available Actions:
{json.dumps(actions_schema, indent=2)}
Determine which action the user wants to perform and extract parameters.
Respond in JSON format:
{{
  "action": "action_name",
  "parameters": {{}},
  "confirmation_message": "Human-readable description of what will happen"
}}
"""
        response = self.model.generate_content(prompt)
        try:
            action_plan = json.loads(response.text)
            return {
                "response_type": "action",
                "answer": action_plan.get(
                    "confirmation_message",
                    "Action identified. Ready to execute.",
                ),
                "action": action_plan.get("action"),
                "parameters": action_plan.get("parameters", {}),
                "requires_confirmation": True,
            }
        except json.JSONDecodeError:
            return {
                "response_type": "error",
                "answer": (
                    "I couldn't determine which action you want to perform. "
                    "Please be more specific."
                ),
            }

    async def handle_explanation(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide forensic explanations using Gemini's knowledge and global memory.
        """
        # Search global memory for similar past cases
        similar_past = GlobalMemoryService.find_similar_cases(self.db, query)
        memory_context = ""
        if similar_past:
            memory_context = "Historical Context (Similar findings in other projects):\n"
            for s in similar_past:
                memory_context += f"- Project {s['project_id']}: {s['title']} ({s['similarity']:.2f} match)\n"

        prompt = f"""
You are a forensic audit expert assistant.
User Question: "{query}"
{memory_context}
Context: Page={context.get('page')}, Project={context.get('project_id')}
Provide a clear, concise explanation suitable for auditors.
If historical context is provided, explain how this current issue might be part of a repeating organizational pattern.
Keep the response under 200 words and actionable.
"""
        response = self.model.generate_content(prompt)
        return {
            "response_type": "explanation",
            "answer": response.text,
            "sources": [s["project_id"] for s in similar_past],
        }

    async def handle_vision_query(
        self, query: str, image_b64: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle multi-modal queries (Receipt/Invoice analysis).
        """
        prompt = f"""
You are a forensic document analyzer for Zenith Platform.
User Request: "{query}"

Analyze the provided image of a receipt, invoice, or bank document.
Perform the following:
1. Extract core financial data (vendor, date, amount, currency, invoice_number).
2. Identify potential forensic red flags (e.g., altered dates, mismatched totals).
3. Detect if it looks like a Duplicate of another record.

Respond with a markdown narrative explaining your findings.
THEN, include a JSON block at the END of your response like this:
```json
{{
  "extracted_data": {{
    "vendor": "...",
    "date": "YYYY-MM-DD",
    "amount": 0.0,
    "currency": "...",
    "invoice_number": "..."
  }},
  "forensic_flags": ["..."],
  "confidence": 0.95
}}
```
"""
        # Create image part
        image_part = {"mime_type": "image/jpeg", "data": image_b64}

        response = self.model.generate_content([prompt, image_part])
        text = response.text

        # Extract JSON from response
        extracted = {}
        try:
            import re
            json_match = re.search(r"```json\n(.*?)\n```", text, re.DOTALL)
            if json_match:
                extracted = json.loads(json_match.group(1))
        except Exception:
            pass

        # Perform Auto-Discovery of matching transactions
        suggestions = []
        if extracted.get("extracted_data"):
            data = extracted["extracted_data"]
            project_id = context.get("project_id")

            # Fuzzy match on amount and roughly the same date
            amount = data.get("amount", 0)
            if amount > 0:

                stmt = select(Transaction).where(
                    Transaction.project_id == project_id,
                    Transaction.actual_amount >= (amount * 0.95),
                    Transaction.actual_amount <= (amount * 1.05),
                    Transaction.status != "matched"
                ).limit(3)
                candidates = self.db.exec(stmt).all()
                for c in candidates:
                    suggestions.append({
                        "id": c.id,
                        "desc": c.description,
                        "amount": c.actual_amount,
                        "date": c.timestamp.isoformat()
                    })

        # Suggest actions based on content
        actions = [
            {"label": "Register as Evidence", "action": "link_evidence"},
            {"label": "Flag Discrepancy", "action": "flag_discrepancy"},
        ]

        if suggestions:
            for s in suggestions:
                actions.append({
                    "label": f"Link to {s['desc'][:20]} (Rp {s['amount']:,.0f})",
                    "action": "confirm_vision_link",
                    "parameters": {"tx_id": s["id"]}
                })

        return {
            "response_type": "vision",
            "answer": text,
            "suggested_actions": actions,
            "metadata": {"suggestions": suggestions}
        }
    async def handle_general_chat(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle casual conversation while maintaining professional tone.
        """
        session_id = context.get("session_id", "default")
        history = get_history(session_id)
        history_text = "\n".join([f"{m['role']}: {m['text']}" for m in history])

        prompt = f"""
You are Frenly, the Zenith Forensic Platform AI assistant.
Recent Conversation:
{history_text}
User: "{query}"
Context: {context.get('page', 'Dashboard')}
Respond professionally but warmly. Keep it brief (under 50 words).
If appropriate, suggest what the user might want to do next.
"""
        response = self.model.generate_content(prompt)
        return {
            "response_type": "chat",
            "answer": response.text,
        }

    async def _explain_sql_results(self, original_query: str, sql: str, data: List[Dict]) -> str:
        """
        Use Gemini to generate human-readable explanation of SQL results.
        """
        data_sample = data[:5] if len(data) > 5 else data
        row_count = len(data)
        prompt = f"""
You queried the forensic database.
User's Question: "{original_query}"
SQL Executed: {sql}
Results: {row_count} rows returned
Sample Data: {json.dumps(data_sample, default=str)}
Provide a concise 2-3 sentence summary of the results.
Highlight any notable findings (high amounts, risk flags, patterns).
Use a professional tone suitable for auditors.
"""
        response = self.model.generate_content(prompt)
        return response.text

    def _suggest_actions_from_results(
        self, data: List[Dict], context: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """
        Suggest relevant follow-up actions based on query results.
        """
        actions = []
        if not data:
            actions.append(
                {
                    "label": "Adjust Query Parameters",
                    "action": "refine_query",
                }
            )
            return actions
        # If results contain high-risk items
        if any(row.get("risk_score", 0) > 0.8 for row in data):
            actions.append(
                {
                    "label": "Create Investigation Case",
                    "action": "create_case",
                    "icon": "shield-alert",
                }
            )
        # Always offer export
        if len(data) > 0:
            actions.append(
                {
                    "label": "Export to Excel",
                    "action": "export",
                    "format": "excel",
                    "icon": "download",
                }
            )
        # Suggest visualization for large datasets
        if len(data) > 10:
            actions.append(
                {
                    "label": "Visualize in Chart",
                    "route": "/forensic/hub",
                    "icon": "chart",
                }
            )
        return actions


class ProactiveMonitor:
    """
    Background monitoring system for anomaly detection.
    Runs periodically to generate proactive alerts.
    """

    def __init__(self, db: Session):
        self.db = db
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    async def run_checks(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Execute all monitoring checks and return alerts.
        """
        alerts = []

        # 0. Fetch persistent Alerts from DB
        alerts.extend(await self._fetch_db_alerts(project_id))

        # 1. Check High-risk transactions (last hour)
        alerts.extend(await self._check_high_risk_transactions(project_id))

        # 2. Check Reconciliation gaps
        alerts.extend(await self._check_reconciliation_gaps(project_id))

        # 3. Check GPS Anomaly (Distance > 50km from site)
        alerts.extend(await self._check_gps_anomalies(project_id))

        return alerts

    async def _fetch_db_alerts(self, project_id: Optional[str]) -> List[Dict[str, Any]]:
        """Fetch unresolved triggers from the FraudAlert table."""
        db_alerts = self.db.exec(
            select(FraudAlert)
            .where(FraudAlert.project_id == project_id if project_id else True)
            .order_by(desc(FraudAlert.created_at))
            .limit(10)
        ).all()

        return [
            {
                "id": a.id,
                "type": a.alert_type,
                "severity": a.severity.lower(),
                "message": a.description,
                "timestamp": a.created_at.isoformat(),
                "action": {"label": "Investigate", "route": "/investigate"},
            }
            for a in db_alerts
        ]

    async def _check_high_risk_transactions(
        self, project_id: Optional[str]
    ) -> List[Dict[str, Any]]:
        # Check for newly flagged high-risk transactions
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        query = select(Transaction).where(Transaction.risk_score > 0.9)
        if project_id:
            query = query.where(Transaction.project_id == project_id)
        query = query.where(Transaction.timestamp > one_hour_ago)
        high_risk_txs = self.db.exec(query).all()
        if high_risk_txs:
            return [
                {
                    "type": "high_risk_transaction",
                    "severity": "critical",
                    "message": (
                        f"🚨 {len(high_risk_txs)} high-risk transactions detected in the last hour"
                    ),
                    "action": {
                        "label": "Review Now",
                        "route": "/investigate",
                    },
                    "metadata": {
                        "count": len(high_risk_txs),
                        "total_amount": sum(tx.amount for tx in high_risk_txs),
                    },
                }
            ]
        return []

    async def _check_reconciliation_gaps(self, project_id: Optional[str]) -> List[Dict[str, Any]]:
        """Check for increasing reconciliation gaps."""
        # Implementation would query reconciliation match status
        # Placeholder for now
        return []

    async def _check_velocity_anomalies(self, project_id: Optional[str]) -> List[Dict[str, Any]]:
        """Detect high-frequency transaction bursts (smurfing)."""
        # Would check forensic_triggers for velocity_burst
        return []

    async def _check_gps_anomalies(self, project_id: Optional[str]) -> List[Dict[str, Any]]:
        """Detect transactions logged far from the project site."""
        from app.models import Project
        import math

        if not project_id: return []

        project = self.db.get(Project, project_id)
        if not project or project.latitude is None or project.longitude is None:
            return []

        # Find transactions with GPS data for this project
        stmt = select(Transaction).where(
            Transaction.project_id == project_id,
            Transaction.latitude is not None,
            Transaction.longitude is not None,
            Transaction.status != "checked" # Optimization
        )
        txs = self.db.exec(stmt).all()

        anomalies = []
        for tx in txs:
            # Haversine distance (approx)
            R = 6371 # Radius of earth in km
            dLat = math.radians(tx.latitude - project.latitude)
            dLon = math.radians(tx.longitude - project.longitude)
            a = math.sin(dLat/2) * math.sin(dLat/2) + \
                math.cos(math.radians(project.latitude)) * math.cos(math.radians(tx.latitude)) * \
                math.sin(dLon/2) * math.sin(dLon/2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c

            if distance > 50: # 50km threshold
                anomalies.append({
                    "type": "gps_anomaly",
                    "severity": "critical" if distance > 200 else "high",
                    "message": f"🚩 GPS Anomaly: Transaction {tx.id[:8]} was logged {distance:.1f}km from the project site.",
                    "action": {"label": "Map Location", "route": f"/forensic/map?tx_id={tx.id}"},
                    "metadata": {"distance_km": distance, "tx_id": tx.id}
                })

        return anomalies

    async def _check_round_amounts(self, project_id: Optional[str]) -> List[Dict[str, Any]]:
        """Detect suspicious clustering of round-number transactions."""
        return []
