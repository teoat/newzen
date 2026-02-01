"""
The Judge - Autonomous Adjudication System (Unified Intelligence Layer).
Generates legal-grade dossiers and court-ready documents with AI Fallback.
"""
import hashlib
import json
import io
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, UTC

from sqlmodel import Session, select
import google.generativeai as genai
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch

from app.models import (
    Case, CaseExhibit,
    AuditLog, IntegrityRegistry,
    Transaction, FraudAlert
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class JudgeService:
    def __init__(self, db: Session):
        self.db = db
        self._initialize_models()

    def _initialize_models(self):
        """Initialize models with fallback capability."""
        try:
            self.model_pro = genai.GenerativeModel(settings.MODEL_PRO)
            self.model_flash = genai.GenerativeModel(settings.MODEL_FLASH)
        except Exception as e:
            logger.error(f"Failed to initialize Judge models: {e}")
            self.model_pro = None
            self.model_flash = None

    async def _safe_generate_content(self, prompt: str, force_flash: bool = False) -> str:
        """Generates content using Pro, falling back to Flash on failure/quota."""
        if not self.model_pro:
            return "THE JUDGE ERROR: Adjudication modules offline."

        # Step 4: Fallback Strategy
        try:
            model = self.model_flash if force_flash else self.model_pro
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            if not force_flash:
                logger.warning(f"Judge Pro model failed, falling back to Flash: {e}")
                try:
                    response = self.model_flash.generate_content(prompt)
                    return response.text.strip()
                except Exception as e2:
                    logger.error(f"Judge models both failed: {e2}")
            return "THE JUDGE ERROR: Intelligence quota exhausted."

    async def generate_verdict_package(
        self,
        case_id: str,
        user_id: str = "system"
    ) -> Dict[str, Any]:
        """
        Assembles comprehensive legal brief and integrity-sealed dossier.
        """
        case = self.db.exec(select(Case).where(Case.id == case_id)).first()
        if not case: return {"error": "Case not found"}

        exhibits = self.db.exec(
            select(CaseExhibit).where(CaseExhibit.case_id == case_id, CaseExhibit.verdict == "ADMITTED")
        ).all()

        audit_logs = self.db.exec(
            select(AuditLog).where(AuditLog.entity_id == case_id).order_by(AuditLog.timestamp)
        ).all()

        dossier = {
            "case_metadata": {
                "case_id": case.id,
                "title": case.title,
                "status": case.status
            },
            "executive_summary": await self._generate_executive_summary(case),
            "evidence_inventory": [
                {"id": ex.id, "type": ex.evidence_type, "label": ex.label, "hash": ex.hash_signature}
                for ex in exhibits
            ],
            "forensic_audit": {
                "confidonce": self._calculate_confidence(case, exhibits)
            },
            "generated_at": datetime.now(UTC).isoformat()
        }

        dossier_hash = hashlib.sha256(json.dumps(dossier, sort_keys=True).encode()).hexdigest()
        
        integrity_record = IntegrityRegistry(
            project_id=case.project_id,
            entity_type="DOSSIER",
            entity_id=case_id,
            file_hash=dossier_hash,
            sealed_by_id=user_id
        )
        self.db.add(integrity_record)
        self.db.commit()

        dossier["integrity_hash"] = dossier_hash
        return dossier

    async def _generate_executive_summary(self, case: Case) -> str:
        """LLM-generated summary with fallback."""
        prompt = f"Generate a 3-paragraph executive summary for case: {case.title}. Description: {case.description}. Tone: Formal, Legal"
        # Executive summaries are descriptive, Flash is usually fine if Pro fails
        return await self._safe_generate_content(prompt)

    async def synthesize_intent_narrative(self, case_id: str) -> Dict[str, Any]:
        """AI 'Mens Rea' Engine: Synthesizes suspected intent for the Theory of Fraud."""
        case = self.db.exec(select(Case).where(Case.id == case_id)).first()
        if not case: return {"error": "Case not found"}

        alerts = self.db.exec(select(FraudAlert).where(FraudAlert.case_id == case_id)).all()
        txs = self.db.exec(select(Transaction).where(Transaction.case_id == case_id)).all()

        anomaly_summary = "\n".join([f"- {a.alert_type}: {a.description}" for a in alerts])
        prompt = f"Analyze for DELIBERATE INTENT (Mens Rea). CASE: {case.title}. ANOMALIES:\n{anomaly_summary}. TASK: Formulate Theory of Fraud."
        
        # Intent analysis is complex, prefers Pro
        narrative = await self._safe_generate_content(prompt)
        
        return {
            "case_id": case_id,
            "intent_narrative": narrative,
            "timestamp": datetime.now(UTC).isoformat()
        }

    def _calculate_confidence(self, case: Case, exhibits: List[CaseExhibit]) -> float:
        """Probability calculation helper."""
        base = 0.5
        boost = min(0.3, len(exhibits) * 0.05)
        return min(1.0, base + boost + (0.1 if case.priority == "CRITICAL" else 0.0))

    async def draft_legal_document(
        self,
        case_id: str,
        template_id: str,
        template_vars: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate legal documents from Jurisdictional Templates (Legal V3).
        """
        case = self.db.exec(
            select(Case).where(Case.id == case_id)
        ).first()

        if not case:
            return "ERROR: Case not found"

        # Mock Template Registry for Lite version
        LEGAL_TEMPLATES = {
            "subpoena": "SUBPOENA AD TESTIFICANDUM\n\nCASE: {case_title}\nDATE: {date}\n...",
            "freezing_order": "ASSET FREEZING ORDER\n\nCASE: {case_title}\nCONFIDENCE: {confidence}\n...",
            "audit_finding": "AUDIT FINDING REPORT\n\nCASE: {case_id}\n\n{intent_theory}"
        }
        
        template = LEGAL_TEMPLATES.get(template_id, "TEMPLATE NOT FOUND")
        
        # Get intent theory if available
        intent_theory = case.chain_of_custody_json.get("intent_theory", "Pending Analysis") if case.chain_of_custody_json else "Pending Analysis"

        return template.format(
            case_id=case.id,
            case_title=case.title,
            date=datetime.now(UTC).strftime("%Y-%m-%d"),
            confidence=f"{self._calculate_confidence(case, []):.1f}",
            intent_theory=intent_theory
        )

    async def generate_pdf_dossier(
        self,
        case_id: str,
        user_id: str
    ) -> io.BytesIO:
        """
        Generates a high-fidelity PDF dossier for court submission.
        """
        data = await self.generate_verdict_package(case_id, user_id)
        if "error" in data:
            raise ValueError(data["error"])

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor("#4F46E5"),
            spaceAfter=20,
            alignment=1
        )

        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor("#1F2937"),
            spaceBefore=15,
            spaceAfter=10
        )

        elements = []
        elements.append(Paragraph("ZENITH FORENSIC PLATFORM", styles['Caption']))
        elements.append(Paragraph("COURT-READY EVIDENCE DOSSIER", title_style))
        elements.append(Spacer(1, 0.2 * inch))

        meta = data["case_metadata"]
        # Safe access to forensic audit
        forensic_data = data.get("forensic_audit", {})
        conf = f"{forensic_data.get('confidonce', 0.5)*100:.1f}%"
        
        meta_data = [
            ["CASE_ID", meta["case_id"]],
            ["TITLE", meta["title"]],
            ["STATUS", meta["status"]],
            ["PROSECUTORIAL_CONFIDENCE", conf],
            ["GENERATED_AT", data["generated_at"]]
        ]
        t = Table(meta_data, colWidths=[1.5*inch, 4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F3F4F6")),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor("#374151")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#E5E7EB"))
        ]))
        elements.append(t)
        elements.append(Spacer(1, 0.3 * inch))

        elements.append(Paragraph("EXECUTIVE SUMMARY", section_style))
        elements.append(Paragraph(data["executive_summary"], styles['BodyText']))
        elements.append(Spacer(1, 0.3 * inch))

        elements.append(Paragraph("SECURED EVIDENCE INVENTORY", section_style))
        ev_data = [["EXHIBIT_ID", "TYPE", "LABEL", "SHA256_HASH"]]
        for ev in data["evidence_inventory"]:
            ev_data.append([
                str(ev["id"])[:8] + "...",
                ev["type"],
                ev["label"],
                ev["hash"][:12] + "..." if ev.get("hash") else "N/A"
            ])

        et = Table(ev_data, colWidths=[
            1.1 * inch, 1.1 * inch, 1.8 * inch, 1.5 * inch
        ])
        et.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        elements.append(et)
        elements.append(Spacer(1, 0.5 * inch))

        elements.append(Paragraph("-" * 100, styles['Caption']))
        
        # --- Cryptographic Footer with QR ---
        qr_data = f"ZENITH_INTEGRITY_SEAL:{data.get('integrity_hash', 'N/A')}\nVERIFIED_AT:{data['generated_at']}"
        qr = qrcode.QRCode(version=1, box_size=4, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        
        # Table for footer to align QR and text
        footer_data = [
            [
                Image(qr_buffer, width=1*inch, height=1*inch),
                Paragraph(f"<b>INTEGRITY_SEAL:</b> {data.get('integrity_hash', 'PENDING')}<br/>"
                          f"Digitally Authenticated by Zenith Adjudication v3.0 (Sovereign-X Core)",
                          styles['Caption'])
            ]
        ]
        ft = Table(footer_data, colWidths=[1.2*inch, 5*inch])
        ft.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
        ]))
        elements.append(ft)

        doc.build(elements)
        buffer.seek(0)
        return buffer
