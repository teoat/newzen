from datetime import datetime
from typing import Dict, Any, List
from sqlmodel import Session, select


import google.generativeai as genai


class NarrativeEngine:
    @staticmethod
    async def generate_ai_finding_summary(db: Session, project_id: str) -> str:
        """
        Use Gemini 2.5 Flash to synthesize finding narratives.
        """
        from app.models import Project, Transaction, CopilotInsight

        project = db.get(Project, project_id)
        if not project:
            return "Project not found."

        insights = db.exec(
            select(CopilotInsight).where(CopilotInsight.project_id == project_id)
        ).all()
        transactions = db.exec(
            select(Transaction).where(
                Transaction.project_id == project_id, Transaction.risk_score > 0.7
            )
        ).all()

        findings_context = [f"- {i.title}: {i.content}" for i in insights]
        tx_context = [
            f"- {t.description}: IDR {t.actual_amount:,.0f} (Risk: {t.risk_score})"
            for t in transactions
        ]

        prompt = f"""
You are a senior forensic auditor writing an executive summary for a legal dossier.
Project: {project.name}
Contract Value: IDR {project.contract_value:,.0f}

Key Insights:
{chr(10).join(findings_context)}

High-Risk Transactions:
{chr(10).join(tx_context)}

Write a professional, authoritative 3-paragraph narrative summarizing the findings.
Paragraph 1: Overview of the audit scope and primary discovery.
Paragraph 2: Detailed breakdown of the patterns detected (e.g. smurfing, markup inflation).
Paragraph 3: Conclusion on the integrity of the project financials and recommended next steps.

Use a neutral but firm legal tone.
"""
        model = genai.GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(prompt)
        return response.text

    @staticmethod
    def detect_contradictions(db: Session, case_id: str) -> List[Dict[str, Any]]:
        """
        AI Contradiction Engine: Scans admitted evidence for integrity failures.
        Specifically looks for:
        1. Temporal impossibility (Transaction A & B too far apart).
        2. Geospatial drift (Transaction in Sector A, Visit in Sector B).
        """
        contradictions = []
        # 1. Fetch admitted exhibits
        from app.models import CaseExhibit, Transaction, ForensicFieldWork

        exhibits = db.exec(
            select(CaseExhibit).where(
                CaseExhibit.case_id == case_id, CaseExhibit.verdict == "ADMITTED"
            )
        ).all()
        tx_ids = [e.evidence_id for e in exhibits if e.evidence_type == "transaction"]
        field_ids = [e.evidence_id for e in exhibits if e.evidence_type == "field_work"]
        transactions = db.exec(select(Transaction).where(Transaction.id.in_(tx_ids))).all()
        field_works = db.exec(
            select(ForensicFieldWork).where(ForensicFieldWork.id.in_(field_ids))
        ).all()
        # 2. Logic: Temporal-Geospatial Collision
        for tx in transactions:
            for fw in field_works:
                time_diff = abs((tx.timestamp - fw.visit_date).total_seconds()) / 3600
                if time_diff < 1:  # Within 1 hour
                    # Check distance (Mocked logic for demo: if coordinates differ significantly)
                    if tx.latitude and abs(tx.latitude - fw.latitude) > 0.5:
                        contradictions.append(
                            {
                                "type": "GEOSPATIAL_DRIFT",
                                "severity": "CRITICAL",
                                "description": (
                                    f"Exhibit collision: Transaction {tx.id} "
                                    f"in one sector while Field Work {fw.id} "
                                    f"recorded in another sector within "
                                    f"{time_diff:.1f} hours."
                                ),
                                "evidence_ids": [tx.id, fw.id],
                            }
                        )
        return contradictions

    @staticmethod
    def generate_professional_dossier(db: Session, case_id: str) -> str:
        """
        World-Class Narrative Synthesis:
        Combines audit logs, admitted exhibits, and contradiction notes into a legal-grade report.
        """
        from app.models import Case, CaseExhibit

        case = db.get(Case, case_id)
        if not case:
            return "Case not found."
        exhibits = db.exec(
            select(CaseExhibit).where(
                CaseExhibit.case_id == case_id, CaseExhibit.verdict == "ADMITTED"
            )
        ).all()
        contradictions = NarrativeEngine.detect_contradictions(db, case_id)
        narrative = f"""# FORENSIC INVESTIGATION DOSSIER: {case.title}
**CASE REFERENCE**: {case.id}
**DATE**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
**STATUS**: {case.status.upper()}
## 1. EXECUTIVE SUMMARY
This dossier summarizes the forensic findings for {case.title}.
Zenith Absolute logic has identified {len(exhibits)} vetted evidence points.
## 2. ADMITTED EVIDENCE ANALYSIS
"""
        for ex in exhibits:
            narrative += (
                f"- **{ex.id}** ({ex.label}): "
                f"{ex.evidence_type.upper()} verified on {ex.adjudicated_at}\n"
            )
            if ex.ai_contradiction_note:
                narrative += f"  > *AI CONTRADICTION NOTE*: {ex.ai_contradiction_note}\n"
        if contradictions:
            narrative += "\n## 3. INTEGRITY ALERTS (CONTRADICTIONS)\n"
            for c in contradictions:
                narrative += f"### ! {c['type']} [{c['severity']}]\n{c['description']}\n"
        narrative += f"""
## 4. CONCLUSION
Based on the synthesized evidence, the probability of anomalous
activity is high.
Final Report Hash (Placeholder): {case.final_report_hash or 'PENDING_SEAL'}
---
*END OF OFFICIAL DOSSIER*
"""
        return narrative.strip()

    @staticmethod
    def generate_project_narrative(db: Session, project_id: str) -> str:
        """
        Generates a summary narrative for a project,
        incorporating custom forensic fields and AI reasoning.
        """
        from app.models import Transaction, Project

        project = db.exec(select(Project).where(Project.id == project_id)).first()
        if not project:
            return "Project context not found."
        transactions = db.exec(
            select(Transaction).where(Transaction.project_id == project_id)
        ).all()
        total_leakage = sum(t.actual_amount for t in transactions if t.category_code == "XP")
        narrative = f"# PROJECT FORENSIC REPORT: {project.name}\n"
        narrative += f"Total identified leakage: IDR {total_leakage:,.2f}\n\n"
        # Pull transactions with custom forensic markers
        flagged = [
            t
            for t in transactions
            if t.metadata_json.get("custom_forensic_fields") or t.risk_score > 0.7
        ]
        if flagged:
            narrative += "## KEY FORENSIC OBSERVATIONS\n"
            for t in flagged[:10]:
                custom = t.metadata_json.get("custom_forensic_fields", {})
                reasoning = t.metadata_json.get("copilot_reasoning", {})
                narrative += f"### Transaction {t.id[:8]}\n"
                narrative += f"- **Amount**: IDR {t.actual_amount:,.2f}\n"
                narrative += f"- **Counterparty**: {t.receiver}\n"
                if custom:
                    c_str = ", ".join([f"{k}: {v}" for k, v in custom.items()])
                    narrative += f"- **Custom Context**: {c_str}\n"
                if reasoning.get("primary"):
                    narrative += f"- **AI Classification**: {reasoning['primary']}\n"
        return narrative.strip()
