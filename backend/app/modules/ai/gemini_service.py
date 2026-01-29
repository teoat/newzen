import google.generativeai as genai
from app.core.key_manager import KeyManager
from app.core.db import get_session
from app.models import Transaction
from sqlmodel import select
import json
from typing import Dict, Any, Optional


class GeminiService:
    def __init__(self):
        self.key_manager = KeyManager()
        self.model_name = "gemini-pro"  # Or gemini-1.5-flash

    def _get_configured_model(self):
        key = self.key_manager.get_key()
        if not key:
            raise ValueError("No API keys available.")
        genai.configure(api_key=key)
        return genai.GenerativeModel(self.model_name)

    async def chat_with_data(self, query: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Processes a natural language query using Gemini, with access to
        defined tools (Function Calling) to query the database.
        """
        try:
            model = self._get_configured_model()
            # 1. Define Tools (Function Definitions)
            # tools = [
            #     {
            #         "function_declarations": [
            #             {
            #                 "name": "get_project_stats",
            #                 "description": "Get financial statistics for a specific project",
            #                 "parameters": {
            #                     "type": "OBJECT",
            #                     "properties": {
            #                         "project_name": {
            #                             "type": "STRING",
            #                             "description": "Name of the project",
            #                         }
            #                     },
            #                     "required": ["project_name"],
            #                 },
            #             },
            #             {
            #                 "name": "search_transactions",
            #                 "description": "Search for transactions based on keywords or amount",
            #                 "parameters": {
            #                     "type": "OBJECT",
            #                     "properties": {
            #                         "keyword": {
            #                             "type": "STRING",
            #                             "description": "Search term for description",
            #                         },
            #                         "min_amount": {
            #                             "type": "NUMBER",
            #                             "description": "Minimum amount",
            #                         },
            #                         "max_amount": {
            #                             "type": "NUMBER",
            #                             "description": "Maximum amount",
            #                         },
            #                     },
            #                 },
            #             },
            #         ]
            #     }
            # ]
            # 2. Start Chat
            # chat = model.start_chat(enable_automatic_function_calling=True)
            # 3. Inject Context
            system_prompt = f"""
            You are Zenith Copilot, a forensic audit assistant.
            Current Context: {json.dumps(context) if context else 'None'}
            Your goal is to assist the investigator by querying data and providing insights.
            Always maintain a professional, analytical tone.
            """
            # 4. Send Message (Gemini handles tool calling internally if enabled,
            # or we simulate it. For simplicity in this Lite version, we'll use
            # a prompt-engineering approach to simulate tool usage if automatic isn't viable
            # without the full tool implementation map.
            # However, `enable_automatic_function_calling` requires passing the actual functions.
            # Let's implement a simpler RAG-like approach for reliability in this specific env).
            # ALTERNATIVE: RAG-Lite
            # We fetch a summary of relevant data first, then feed it to Gemini.
            db = next(get_session())
            # Quick stat fetch
            tx_count = db.exec(select(Transaction)).all()
            total_val = sum(t.actual_amount for t in tx_count)
            prompt = f"""
            {system_prompt}
            Database Snapshot:
            - Total Transactions: {len(tx_count)}
            - Total Volume: {total_val:,.2f} IDR
            User Query: {query}
            Answer the user based on the snapshot and your forensic knowledge.
            """
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            # Fallback logic could go here (try next key)
            print(f"Gemini Error: {e}")
            return "I'm currently unable to connect to the neural core. Please check my API configuration."
