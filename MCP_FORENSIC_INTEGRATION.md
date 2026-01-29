# MCP Forensic Integration: Diagnostic & Strategy

To ensure the **Zenith Absolute** application remains "always in tune" with forensic results, we recommend implementing a set of **Model Context Protocol (MCP)** servers and tools within the application layer.

## 1. Live Evidence Resource (The "Pulse")

**Concept**: Expose current investigation results as a dynamic MCP Resource.

- **URI Schema**: `forensic://project/{id}/anomalies`
- **Benefit**: When an investigator (or an AI agent) is working, they can "attach" to this resource. Any new ingestion finding (e.g., a "ROUND_AMOUNT_PATTERN" detection) immediately updates the context of the AI, allowing it to provide proactive alerts without a manual refresh.

## 2. Reasoning Copilot Tool (The "Inside Man")

**Concept**: Expose the `ForensicCopilot` inner monologue as an MCP Tool.

- **Tool Name**: `get_forensic_rationale`
- **Arguments**: `transaction_id`
- **Benefit**: Allows the AI to explain *why* something was flagged. Instead of just seeing "RISK_SCORE: 0.85", the agent can call this tool to see the specific keyword matches and semantic boosting results (e.g., "Matched personal leakage signature due to keyword 'LUNCH' in high-altitude sector").

## 3. Vector-Search Entity Resolver

**Concept**: Expose the Vector Engine as a searchable tool for cross-project intelligence.

- **Tool Name**: `find_semantic_entities`
- **Arguments**: `query_text`, `min_confidence`
- **Benefit**: Investigators can find entities across the entire database that "feel" similar to a suspect, even if names are mismatched, by tapping into the `embeddings_json` fields we just added.

## 4. Reconciliation Waterfall Thinning Tool

**Concept**: Expose the new `match_waterfall` logic as a triggered tool.

- **Tool Name**: `optimize_reconciliation`
- **Arguments**: `project_id`, `method` (Waterfall, Fuzzy, Burst)
- **Benefit**: Allows the AI to autonomously try different "thinning" strategies to resolve a balance gap, reporting back only the results that improved the confidence score.

---
**Status**: Models and Database Schemas are now ready to support these features (Embeddings added).
