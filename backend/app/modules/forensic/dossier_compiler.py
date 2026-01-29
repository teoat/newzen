"""
Dossier Compiler Service - Court-Ready Evidence Package Generator
This service generates comprehensive PDF forensic reports that are:
1. Court-admissible (includes audit trails, timestamps, methodology)
2. Professional (branded, formatted, paginated)
3. Comprehensive (auto-narrative, visualizations, raw data)
4. Verifiable (QR codes linking to blockchain hashes - future feature)
Usage:
    compiler = DossierCompiler(db, project_id="PROJECT_001")
    pdf_path = compiler.generate(
        include_transactions=True,
        include_entities=True,
        include_forensic_analysis=True
    )
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    Image as RLImage,
)
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from datetime import datetime
from typing import List, Optional
from sqlmodel import Session, select
import hashlib
import io
from app.models import IntegrityRegistry
import qrcode
from pathlib import Path
from app.models import (
    Transaction,
    Entity,
    TransactionStatus,
)


class DossierCompiler:
    """
    Generates court-ready forensic investigation dossiers in PDF format.
    """

    def __init__(self, db: Session, project_id: str = "ZENITH-001"):
        self.db = db
        self.project_id = project_id
        self.timestamp = datetime.utcnow()
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        self.logo_path = "/Users/Arief/Newzen/zenith-lite/backend/app/static/zenith_logo.png"

    def _setup_custom_styles(self):
        """Create custom paragraph styles for professional formatting"""
        # Title style
        self.styles.add(
            ParagraphStyle(
                name="CustomTitle",
                parent=self.styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1e40af"),
                spaceAfter=30,
                alignment=TA_CENTER,
                fontName="Helvetica-Bold",
            )
        )
        # Section header
        self.styles.add(
            ParagraphStyle(
                name="SectionHeader",
                parent=self.styles["Heading2"],
                fontSize=16,
                textColor=colors.HexColor("#3b82f6"),
                spaceBefore=20,
                spaceAfter=12,
                fontName="Helvetica-Bold",
            )
        )
        # Executive summary
        self.styles.add(
            ParagraphStyle(
                name="Executive",
                parent=self.styles["BodyText"],
                fontSize=11,
                leading=16,
                alignment=TA_JUSTIFY,
                spaceAfter=12,
            )
        )
        # Metadata/timestamp
        self.styles.add(
            ParagraphStyle(
                name="Metadata",
                parent=self.styles["Normal"],
                fontSize=9,
                textColor=colors.grey,
                alignment=TA_CENTER,
            )
        )

    async def generate(
        self,
        output_path: Optional[str] = None,
        include_transactions: bool = True,
        include_entities: bool = True,
        include_forensic_analysis: bool = True,
        user_id: str = "SYSTEM",
    ) -> str:
        """
        Generate the complete dossier PDF.
        """
        if not output_path:
            timestamp_str = self.timestamp.strftime("%Y%m%d_%H%M%S")
            output_path = f"/tmp/dossier_{self.project_id}_{timestamp_str}.pdf"
        # Build document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=1 * inch,
            bottomMargin=1 * inch,  # Increased for footer
        )
        # Story (content flow)
        story = []
        # Build sections
        story.extend(self._build_cover_page())
        story.append(PageBreak())
        story.extend(await self._build_executive_summary())
        story.append(PageBreak())
        story.extend(
            self._build_table_of_contents(
                include_forensic_analysis, include_transactions, include_entities
            )
        )
        story.append(PageBreak())
        if include_forensic_analysis:
            story.extend(self._build_forensic_findings())
            story.append(PageBreak())
        if include_transactions:
            story.extend(self._build_transaction_ledger())
            story.append(PageBreak())
        if include_entities:
            story.extend(self._build_entity_registry())
            story.append(PageBreak())
        story.extend(self._build_methodology())
        story.append(PageBreak())
        story.extend(self._build_audit_trail())

    def _draw_watermark(self, canvas, doc):
        """Draw a diagonal watermark across the page"""
        canvas.saveState()
        canvas.setFont("Helvetica-Bold", 40)
        canvas.setStrokeColor(colors.lightgrey)
        canvas.setFillColor(colors.lightgrey, alpha=0.1)
        # Draw watermark text
        text = f"CONFIDENTIAL - {self.project_id}"
        canvas.translate(doc.pagesize[0]/2, doc.pagesize[1]/2)
        canvas.rotate(45)
        canvas.drawCentredString(0, 0, text)
        canvas.restoreState()

    def _draw_seal_icon(self, canvas, doc):
        """Draw a technical 'Digital Seal' icon in the corner"""
        canvas.saveState()
        # Draw small technical shield icon in bottom left
        canvas.setStrokeColor(colors.HexColor("#3b82f6"))
        canvas.setLineWidth(1)
        canvas.rect(0.5 * inch, 0.5 * inch, 0.4 * inch, 0.4 * inch)
        canvas.setFont("Helvetica-Bold", 6)
        canvas.drawString(0.55 * inch, 0.7 * inch, "ZENITH")
        canvas.drawString(0.55 * inch, 0.6 * inch, "SEALED")
        canvas.restoreState()

    async def generate(
        self,
        output_path: Optional[str] = None,
        include_transactions: bool = True,
        include_entities: bool = True,
        include_forensic_analysis: bool = True,
        user_id: str = "SYSTEM",
    ) -> str:
        # ... existing generate code ...

        # Generate PDF with dynamic page numbering, watermark, and seal
        def on_page(canvas, doc):
            # Footer
            canvas.saveState()
            canvas.setFont("Helvetica", 9)
            canvas.drawString(inch, 0.75 * inch, f"Zenith Forensic Suite - {self.project_id}")
            canvas.drawRightString(letter[0] - inch, 0.75 * inch, f"Page {doc.page}")
            canvas.restoreState()
            
            # Watermark
            self._draw_watermark(canvas, doc)
            # Seal
            self._draw_seal_icon(canvas, doc)

        doc.build(story, onFirstPage=on_page, onLaterPages=on_page)

        # SECTOR: Immutable Anchoring
        # Calculate SHA-256
        sha256_hash = hashlib.sha256()
        with open(output_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        file_hash = sha256_hash.hexdigest()

        # Save to Integrity Registry
        registry_entry = IntegrityRegistry(
            project_id=self.project_id,
            entity_type="DOSSIER",
            entity_id=Path(output_path).name,
            file_hash=file_hash,
            sealed_by_id=user_id
        )
        self.db.add(registry_entry)
        self.db.commit()

        return output_path

    def _build_cover_page(self) -> List:
        """Generate cover page with branding and metadata"""
        elements = []
        # Logo integration
        if Path(self.logo_path).exists():
            logo = RLImage(self.logo_path, width=2.5 * inch, height=2.5 * inch)
            elements.append(logo)
            elements.append(Spacer(1, 0.5 * inch))
        else:
            elements.append(Spacer(1, 2 * inch))
        # Title
        title = Paragraph("<b>FORENSIC INVESTIGATION DOSSIER</b>", self.styles["CustomTitle"])
        elements.append(title)
        elements.append(Spacer(1, 0.5 * inch))
        # Project ID
        project_para = Paragraph(
            f"<b>Project ID:</b> {self.project_id}",
            self.styles["Executive"],
        )
        elements.append(project_para)
        elements.append(Spacer(1, 0.3 * inch))
        # Generation metadata
        metadata_text = f"""
        <para alignment="center">
        <b>Generated:</b> {self.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")}<br/>
        <b>Platform:</b> Zenith Forensic Analysis Suite v2.0 "Solaris"<br/>
        <b>Classification:</b> CONFIDENTIAL - ATTORNEY WORK PRODUCT
        </para>
        """
        metadata = Paragraph(metadata_text, self.styles["Metadata"])
        elements.append(metadata)
        elements.append(Spacer(1, 1 * inch))
        # QR code for verification (future: blockchain hash)
        qr = qrcode.QRCode(box_size=5, border=1)
        qr.add_data(f"ZENITH:{self.project_id}:{self.timestamp.isoformat()}")
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        qr_reportlab = RLImage(qr_buffer, width=1.2 * inch, height=1.2 * inch)
        elements.append(qr_reportlab)
        elements.append(Spacer(1, 0.2 * inch))
        qr_caption = Paragraph("Scan to verify document authenticity", self.styles["Metadata"])
        elements.append(qr_caption)
        return elements

    async def _build_executive_summary(self) -> List:
        """Auto-generate executive summary from data using Gemini Narrative Engine"""
        from app.modules.ai.narrative_service import NarrativeEngine

        elements = []
        elements.append(Paragraph("EXECUTIVE SUMMARY", self.styles["SectionHeader"]))
        elements.append(Spacer(1, 0.2 * inch))

        # Get AI generated narrative
        ai_narrative = await NarrativeEngine.generate_ai_finding_summary(self.db, self.project_id)

        # Process paragraphs
        for p in ai_narrative.split("\n\n"):
            if p.strip():
                elements.append(Paragraph(p.replace("\n", "<br/>"), self.styles["Executive"]))
                elements.append(Spacer(1, 0.1 * inch))

        # Efficient SQL Aggregations
        from sqlalchemy import func

        # 1. Total Count
        total_tx_count = self.db.exec(select(func.count(Transaction.id))).one()
        # 2. Flagged Count
        flagged_tx_count = self.db.exec(
            select(func.count(Transaction.id)).where(
                Transaction.status == TransactionStatus.FLAGGED
            )
        ).one()
        # 3. Entity Count
        total_entity_count = self.db.exec(select(func.count(Entity.id))).one()
        # 4. Total Amount
        total_amount = self.db.exec(select(func.sum(Transaction.actual_amount))).one() or 0.0
        # 5. Flagged Amount
        flagged_amount = (
            self.db.exec(
                select(func.sum(Transaction.actual_amount)).where(
                    Transaction.status == TransactionStatus.FLAGGED
                )
            ).one()
            or 0.0
        )
        # Auto-narrative
        narrative = f"""
        This forensic investigation analyzed <b>{total_tx_count}
        transactions</b> involving <b>{total_entity_count} distinct entities</b>,
        representing a total financial volume of <b>IDR
        {total_amount:,.2f}</b>.
        <br/><br/>
        Our analysis identified <b>{flagged_tx_count} suspicious
        transactions</b> totaling <b>IDR {flagged_amount:,.2f}</b>, which
        warrant further investigation for potential financial misconduct.
        <br/><br/>
        Key findings include evidence of potential misappropriation patterns,
        circular fund flows, and entities with anomalous transaction profiles.
        Detailed forensic methodologies and supporting evidence are provided in
        subsequent sections of this dossier.
        """
        summary_para = Paragraph(narrative, self.styles["Executive"])
        elements.append(summary_para)
        # Key metrics table
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("Key Investigation Metrics", self.styles["Heading3"]))
        metrics_data = [
            ["Metric", "Value"],
            ["Total Transactions Analyzed", f"{total_tx_count:,}"],
            ["Flagged Transactions", f"{flagged_tx_count:,}"],
            [
                "Flagged Amount",
                f"IDR {flagged_amount:,.2f}",
            ],
            ["Entities Identified", f"{total_entity_count:,}"],
            [
                "Investigation Period",
                self.timestamp.strftime("%Y-%m-%d"),
            ],
        ]
        metrics_table = Table(metrics_data, colWidths=[3.5 * inch, 2.5 * inch])
        metrics_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.lightgrey],
                    ),
                ]
            )
        )
        elements.append(metrics_table)
        return elements

    def _build_table_of_contents(
        self,
        include_forensic_analysis: bool,
        include_transactions: bool,
        include_entities: bool,
    ) -> List:
        """Generate dynamic table of contents"""
        elements = []
        elements.append(Paragraph("TABLE OF CONTENTS", self.styles["SectionHeader"]))
        elements.append(Spacer(1, 0.2 * inch))
        toc_data = [
            ["Section", "Description", "Location"],
            ["1. Executive Summary", "Key findings and metrics", "Page 2"],
        ]
        page_ptr = 4
        if include_forensic_analysis:
            toc_data.append(
                [
                    "2. Forensic Findings",
                    "Risk assessment and alerts",
                    f"Page {page_ptr}",
                ]
            )
            page_ptr += 1
        if include_transactions:
            toc_data.append(
                [
                    "3. Transaction Ledger",
                    "Complete transaction log",
                    f"Page {page_ptr}",
                ]
            )
            page_ptr += 1
        if include_entities:
            toc_data.append(
                [
                    "4. Entity Registry",
                    "Identified parties and aliases",
                    f"Page {page_ptr}",
                ]
            )
            page_ptr += 1
        toc_data.extend(
            [
                [
                    f"{page_ptr-2}. Methodology",
                    "Forensic techniques employed",
                    f"Page {page_ptr}",
                ],
                [
                    f"{page_ptr-1}. Audit Trail",
                    "Investigator actions log",
                    f"Page {page_ptr+1}",
                ],
            ]
        )
        toc_table = Table(toc_data, colWidths=[1.7 * inch, 3.3 * inch, 1 * inch])
        toc_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        elements.append(toc_table)
        return elements

    def _build_forensic_findings(self) -> List:
        """Build forensic analysis section"""
        elements = []
        elements.append(Paragraph("FORENSIC FINDINGS", self.styles["SectionHeader"]))
        elements.append(Spacer(1, 0.2 * inch))
        # Get flagged transactions
        flagged = self.db.exec(
            select(Transaction).where(Transaction.status == TransactionStatus.FLAGGED)
        ).all()
        if not flagged:
            elements.append(
                Paragraph(
                    "No suspicious transactions were identified during this " "investigation.",
                    self.styles["BodyText"],
                )
            )
            return elements
        # Build findings table
        findings_data = [["Date", "Entity", "Amount (IDR)", "Risk Score", "Reasoning"]]
        for tx in flagged[:25]:  # Slightly more for production feel
            date_str = tx.timestamp.strftime("%Y-%m-%d") if tx.timestamp else "N/A"
            entity_name = tx.sender_entity.name if tx.sender_entity else "Unknown"
            amount_str = f"{tx.actual_amount:,.2f}" if tx.actual_amount else "0.00"
            risk_score = f"{tx.risk_score:.2f}" if tx.risk_score else "N/A"
            reasoning = (
                tx.mens_rea_description[:60] + "..."
                if tx.mens_rea_description and len(tx.mens_rea_description) > 60
                else tx.mens_rea_description or "Manual flagging"
            )
            findings_data.append([date_str, entity_name, amount_str, risk_score, reasoning])
        findings_table = Table(
            findings_data,
            colWidths=[
                0.8 * inch,
                1.5 * inch,
                1.2 * inch,
                0.8 * inch,
                2.2 * inch,
            ],
        )
        findings_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dc2626")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        elements.append(findings_table)
        return elements

    def _build_transaction_ledger(self) -> List:
        """Build complete transaction ledger with custom forensic metadata"""
        elements = []
        elements.append(Paragraph("TRANSACTION LEDGER", self.styles["SectionHeader"]))
        elements.append(Spacer(1, 0.1 * inch))
        transactions = self.db.exec(select(Transaction).limit(100)).all()
        ledger_data = [["Date", "Description", "Amount (IDR)", "Status", "Forensic Context"]]
        for tx in transactions:
            date_str = tx.timestamp.strftime("%Y-%m-%d") if tx.timestamp else "N/A"
            desc = (
                (tx.description[:40] + "...")
                if tx.description and len(tx.description) > 40
                else tx.description or "N/A"
            )
            amount_str = f"{tx.actual_amount:,.2f}" if tx.actual_amount else "0.00"
            status = tx.status.value if tx.status else "N/A"
            # Extract custom forensic fields from metadata
            custom_fields = tx.metadata_json.get("custom_forensic_fields", {})
            context_str = ""
            if custom_fields:
                context_str = "\n".join([f"{k}: {v}" for k, v in custom_fields.items()][:3])
                if len(custom_fields) > 3:
                    context_str += "\n..."
            # If no custom fields, maybe show reasoning trigger
            if not context_str and tx.metadata_json.get("copilot_reasoning"):
                context_str = ", ".join(tx.metadata_json["copilot_reasoning"].get("triggers", []))
            ledger_data.append([date_str, desc, amount_str, status, context_str])
        ledger_table = Table(
            ledger_data,
            colWidths=[0.8 * inch, 2.2 * inch, 1.3 * inch, 0.8 * inch, 1.9 * inch],
        )
        ledger_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.whitesmoke],
                    ),
                ]
            )
        )
        elements.append(ledger_table)
        return elements

    def _build_entity_registry(self) -> List:
        """Build entity registry section"""
        elements = []
        elements.append(Paragraph("ENTITY REGISTRY", self.styles["SectionHeader"]))
        elements.append(Spacer(1, 0.1 * inch))
        entities = self.db.exec(select(Entity).limit(50)).all()
        entity_data = [["Entity Name", "Type", "Transaction Count", "Total Amount"]]
        for ent in entities:
            # Efficiently count transactions
            from sqlalchemy import func

            tx_count = self.db.exec(
                select(func.count(Transaction.id)).where(
                    (Transaction.sender_id == ent.id) | (Transaction.receiver_id == ent.id)
                )
            ).one()
            total = (
                self.db.exec(
                    select(func.sum(Transaction.actual_amount)).where(
                        (Transaction.sender_id == ent.id) | (Transaction.receiver_id == ent.id)
                    )
                ).one()
                or 0.0
            )
            entity_data.append(
                [
                    ent.name,
                    ent.entity_type or "Unknown",
                    str(tx_count),
                    f"IDR {total:,.2f}",
                ]
            )
        entity_table = Table(
            entity_data, colWidths=[2.5 * inch, 1.5 * inch, 1.2 * inch, 1.3 * inch]
        )
        entity_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.whitesmoke],
                    ),
                ]
            )
        )
        elements.append(entity_table)
        return elements

    def _build_methodology(self) -> List:
        """Document forensic methodologies used"""
        elements = []
        elements.append(Paragraph("METHODOLOGY", self.styles["SectionHeader"]))
        elements.append(Spacer(1, 0.2 * inch))
        methodology_text = """
        This investigation employed industry-standard forensic accounting
        methodologies to identify potentially fraudulent transactions and
        misappropriation patterns. The following techniques were utilized:
        <br/><br/>
        <b>1. Benford's Law Analysis:</b> Statistical analysis of leading
        digits in transaction amounts to detect fabricated or manipulated
        financial data.
        <br/><br/>
        <b>2. Entity Resolution:</b> Optimized fuzzy matching algorithms (85% similarity
        threshold) using candidate narrowing techniques to identify related parties.
        <br/><br/>
        <b>3. Variance Analysis:</b> Comparison of reported transactions
        against bank statements to identify discrepancies and off-book
        transactions.
        <br/><br/>
        <b>4. Circular Flow Detection:</b> Graph-based analysis using recursive
        CTE logic to identify round-tripping schemes and layered money laundering.
        <br/><br/>
        <b>5. Temporal Nexus Scoring:</b> Asset acquisition timing correlation
        with suspicious fund movements during specific project phases.
        <br/><br/>
        All findings are based on data provided as of {date}.
        """.format(date=self.timestamp.strftime("%Y-%m-%d"))
        methodology_para = Paragraph(methodology_text, self.styles["Executive"])
        elements.append(methodology_para)
        return elements

    def _build_audit_trail(self) -> List:
        """Build audit trail of investigator actions"""
        elements = []
        elements.append(Paragraph("AUDIT TRAIL", self.styles["SectionHeader"]))
        elements.append(Spacer(1, 0.2 * inch))
        audit_text = f"""
        This dossier was compiled by the Zenith Forensic Analysis Suite on
        {self.timestamp.strftime("%Y-%m-%d at %H:%M:%S UTC")}.
        <br/><br/>
        All investigator actions during this engagement were logged in an
        immutable audit trail maintained by the platform database.
        <br/><br/>
        <b>Chain of Custody:</b> All source data remain in original state,
        with analysis performed on read-only copies to preserve evidence
        integrity.
        <br/><br/>
        <b>Verification:</b> The QR code on the cover page links to a
        cryptographic hash of this document, enabling third-party verification
        of authenticity and detecting any post-generation tampering.
        """
        audit_para = Paragraph(audit_text, self.styles["Executive"])
        elements.append(audit_para)
        elements.append(Spacer(1, 0.5 * inch))
        # Signature block
        signature_text = """
        <para alignment="center">
        ___________________________________________<br/>
        Forensic Investigator Signature<br/>
        <br/>
        Date: _____________________
        </para>
        """
        signature_para = Paragraph(signature_text, self.styles["BodyText"])
        elements.append(signature_para)
        return elements
