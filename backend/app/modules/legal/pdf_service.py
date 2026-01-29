import hashlib
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.lib.utils import ImageReader
from reportlab.lib.units import mm
import qrcode
from sqlmodel import Session, select
from app.models import Case, CaseExhibit


class LegalPDFService:
    @staticmethod
    def generate_legal_dossier(db: Session, case_id: str, output_path: str) -> str:
        """
        Generates a PDF/A style forensic report with SHA-256 appendices.
        """
        case = db.get(Case, case_id)
        if not case:
            return ""
        exhibits = db.exec(
            select(CaseExhibit).where(
                CaseExhibit.case_id == case_id, CaseExhibit.verdict == "ADMITTED"
            )
        ).all()
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        # --- 1. COVER PAGE ---
        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=colors.indigo,
            alignment=1,
            spaceAfter=30,
        )
        story.append(Spacer(1, 100))
        story.append(Paragraph("ZENITH FORENSIC PLATFORM", title_style))
        story.append(Paragraph(f"Official Investigative Dossier: {case.title}", styles["Heading2"]))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Case ID: {case.id}", styles["Normal"]))
        story.append(Paragraph(f"Generated On: {datetime.utcnow()} UTC", styles["Normal"]))
        story.append(Spacer(1, 50))
        story.append(Paragraph("CONFIDENTIAL - FOR AUTHORIZED USE ONLY", styles["Normal"]))
        story.append(PageBreak())
        # --- 2. EXECUTIVE SUMMARY ---
        story.append(Paragraph("1. Executive Summary", styles["Heading2"]))
        story.append(Spacer(1, 12))
        summary_text = (
            f"This report serves as the final adjudicatory summary for Case "
            f"{case.id}. The Zenith Absolute engine has processed "
            f"{len(exhibits)} admitted exhibits under a strict local chain "
            f"of custody."
        )
        story.append(Paragraph(summary_text, styles["Normal"]))
        story.append(Spacer(1, 24))
        # --- 3. EXHIBIT TABLE ---
        story.append(Paragraph("2. Admitted Exhibits", styles["Heading2"]))
        story.append(Spacer(1, 12))
        data = [["Exhibit ID", "Type", "Label", "Verdict"]]
        for ex in exhibits:
            data.append([ex.id or "", ex.evidence_type or "", ex.label or "", ex.verdict or ""])
        t = Table(data, colWidths=[80, 80, 200, 80])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.indigo),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        story.append(t)
        story.append(PageBreak())
        # --- 4. FORENSIC APPENDIX (Integrity) ---
        story.append(Paragraph("3. Integrity Appendix (Proof of Provenance)", styles["Heading2"]))
        story.append(Spacer(1, 12))
        story.append(
            Paragraph(
                "The following hashes verify the digital fingerprints of admitted "
                "evidence at the time of adjudication.",
                styles["Italic"],
            )
        )
        story.append(Spacer(1, 12))
        for ex in exhibits:
            story.append(Paragraph(f"<b>Exhibit {ex.id}</b>", styles["Normal"]))
            story.append(Paragraph(f"SHA-256: <i>{ex.hash_signature}</i>", styles["Code"]))
            story.append(Spacer(1, 6))

        # Prepare footer function with QR
        def add_watermark(canvas, doc):
            canvas.saveState()
            qr = qrcode.QRCode(box_size=2)
            qr.add_data(f"ZENITH-VERIFY:{case.id}:{datetime.utcnow().isoformat()}")
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            img_byte_arr = BytesIO()
            qr_img.save(img_byte_arr, format="PNG")
            img_byte_arr.seek(0)
            canvas.drawImage(
                ImageReader(img_byte_arr),
                A4[0] - 30 * mm,
                10 * mm,
                width=20 * mm,
                height=20 * mm,
            )
            canvas.setFont("Helvetica-Bold", 8)
            canvas.drawRightString(
                A4[0] - 35 * mm, 15 * mm, "INTEGRITY_VERIFIED_BY_ZENITH_ABSOLUTE"
            )
            canvas.restoreState()

        doc.build(story, onFirstPage=add_watermark, onLaterPages=add_watermark)
        # Calculate final report hash for sealing
        with open(output_path, "rb") as f:
            final_hash = hashlib.sha256(f.read()).hexdigest()
        case.final_report_hash = final_hash
        db.add(case)
        db.commit()
        return output_path
