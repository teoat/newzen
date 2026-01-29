from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO


def generate_dossier_pdf(data: dict) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    h2_style = styles["Heading2"]
    normal_style = styles["Normal"]
    # 1. Title
    elements.append(Paragraph("Zenith Forensic Dossier", title_style))
    elements.append(Paragraph(f"Generated: {data.get('report_generated_at')}", normal_style))
    elements.append(Spacer(1, 20))
    # 2. Executive Summary
    elements.append(Paragraph("Executive Summary", h2_style))
    summary = data.get("executive_summary", {})
    summary_data = [
        ["Metric", "Value"],
        ["Total Funds At Risk", f"IDR {summary.get('total_funds_at_risk', 0):,}"],
        ["Inflation Detected", f"IDR {summary.get('total_inflation_detected', 0):,}"],
        ["Personal Leakage", f"IDR {summary.get('total_personal_leakage', 0):,}"],
        ["Integrity Status", summary.get("integrity_status", "UNKNOWN")],
    ]
    t = Table(summary_data)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ]
        )
    )
    elements.append(t)
    elements.append(Spacer(1, 20))
    # 3. Inflation Scheme
    elements.append(Paragraph("Verified Inflation Scheme", h2_style))
    inflation_list = data.get("forensic_findings", {}).get("inflation_scheme", [])
    if inflation_list:
        inf_table_data = [["Description", "Proposed", "Actual", "Delta"]]
        for item in inflation_list:
            inf_table_data.append(
                [
                    item["desc"][:30],
                    f"{item['proposed']:,}",
                    f"{item['actual']:,}",
                    f"{item['delta']:,}",
                ]
            )
        t_inf = Table(inf_table_data)
        t_inf.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.darkred),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]
            )
        )
        elements.append(t_inf)
    else:
        elements.append(Paragraph("No inflation detected.", normal_style))
    elements.append(Spacer(1, 20))
    # 4. Chain of Custody
    elements.append(Paragraph("Chain of Custody (Audit Logs)", h2_style))
    logs = data.get("chain_of_custody_logs", [])
    if logs:
        log_table_data = [["Time", "Action", "Change"]]
        for log in logs[:20]:  # Limit to 20 for PDF
            log_table_data.append([log["time"][:16], log["action"], log["change"][:50]])
        t_log = Table(log_table_data, colWidths=[100, 100, 300])
        t_log.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                ]
            )
        )
        elements.append(t_log)
    doc.build(elements)
    buffer.seek(0)
    return buffer
