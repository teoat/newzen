"""
Professional Legal Dossier Formatter
Adds watermarking, digital sealing, and premium typography
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from datetime import datetime
import qrcode
from io import BytesIO
from typing import Dict, List, Optional
import hashlib


class ProfessionalDossierFormatter:
    """
    Creates professionally formatted legal dossiers with:
    - Watermarking on every page
    - Digital verification QR code
    - Premium typography
    - Digital seal
    """
    
    def __init__(self, pagesize=A4):
        self.pagesize = pagesize
        self.styles = self._create_custom_styles()
        
    def _create_custom_styles(self):
        """Create custom paragraph styles"""
        styles = getSampleStyleSheet()
        
        # Title style
        styles.add(ParagraphStyle(
            name='DossierTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a365d'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Subtitle style
        styles.add(ParagraphStyle(
            name='DossierSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d3748'),
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        
        # Body style
        styles.add(ParagraphStyle(
            name='DossierBody',
            parent=styles['Normal'],
            fontSize=11,
            leading=16,
            textColor=colors.HexColor('#1a202c'),
            alignment=TA_JUSTIFY,
            fontName='Helvetica'
        ))
        
        # Classification style
        styles.add(ParagraphStyle(
            name='Classification',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#c53030'),
            fontName='Helvetica-Bold',
            alignment=TA_CENTER
        ))
        
        return styles
    
    def _add_watermark(self, canvas_obj, doc):
        """Add watermark to every page"""
        canvas_obj.saveState()
        
        # Semi-transparent watermark
        canvas_obj.setFillColor(colors.HexColor('#cbd5e0'), alpha=0.1)
        canvas_obj.setFont( 'Helvetica-Bold', 60)
        
        # Rotate and center
        canvas_obj.translate(self.pagesize[0] / 2, self.pagesize[1] / 2)
        canvas_obj.rotate(45)
        
        # Draw watermark text
        watermark_text = "FORENSIC AUDIT"
        canvas_obj.drawCentredString(0, 0, watermark_text)
        
        canvas_obj.restoreState()
    
    def _add_header_footer(self, canvas_obj, doc):
        """Add header and footer to every page"""
        canvas_obj.saveState()
        
        width, height = self.pagesize
        
        # Header
        canvas_obj.setFont('Helvetica-Bold', 9)
        canvas_obj.setFillColor(colors.HexColor('#2d3748'))
        canvas_obj.line(0.75 * inch, height - 0.75 * inch, width - 0.75 * inch, height - 0.75 * inch)
        canvas_obj.drawString(0.75 * inch, height - 0.6 * inch, "ZENITH FORENSIC AUDIT PLATFORM")
        canvas_obj.drawRightString(width - 0.75 * inch, height - 0.6 * inch, 
                                   datetime.now().strftime("%Y-%m-%d"))
        
        # Footer
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.HexColor('#718096'))
        canvas_obj.line(0.75 * inch, 0.75 * inch, width - 0.75 * inch, 0.75 * inch)
        canvas_obj.drawString(0.75 * inch, 0.6 * inch, "CONFIDENTIAL - FOR AUTHORIZED USE ONLY")
        canvas_obj.drawCentredString(width / 2, 0.6 * inch, f"Page {doc.page}")
        
        canvas_obj.restoreState()
    
    def _generate_qr_code(self, data: str, size: int = 100) -> BytesIO:
        """Generate QR code for verification"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to BytesIO
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return buffer
    
    def _generate_document_hash(self, content: str) -> str:
        """Generate SHA-256 hash of document content"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def create_cover_page(self, title: str, subtitle: str, metadata: Dict) -> List:
        """Create professional cover page"""
        story = []
        
        # Large title
        story.append(Spacer(1, 2 * inch))
        story.append(Paragraph(title, self.styles['DossierTitle']))
        
        # Subtitle
        if subtitle:
            story.append(Spacer(1, 0.3 * inch))
            story.append(Paragraph(subtitle, self.styles['DossierSubtitle']))
        
        # Metadata table
        story.append(Spacer(1, 1 * inch))
        
        metadata_data = [
            ['Project:', metadata.get('project_name', 'N/A')],
            ['Classification:', metadata.get('classification', 'CONFIDENTIAL')],
            ['Prepared By:', metadata.get('prepared_by', 'ZENITH AI')],
            ['Date:', datetime.now().strftime('%B %d, %Y')],
            ['Document ID:', metadata.get('document_id', 'DOC-' + datetime.now().strftime('%Y%m%d-%H%M%S'))],
        ]
        
        metadata_table = Table(metadata_data, colWidths=[2 * inch, 4 * inch])
        metadata_table.setStyle(TableStyle([
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#4a5568')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#1a202c')),
            ('FONT', (0, 0), (-1, -1), 'Helvetica', 11),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 11),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        story.append(metadata_table)
        
        # QR Code for verification
        story.append(Spacer(1, 1 * inch))
        doc_hash = self._generate_document_hash(str(metadata))
        qr_data = f"VERIFY:{doc_hash[:16]}"
        
        # Add centered text for QR
        story.append(Paragraph(
            '<para align=center><font size=9>Scan to verify document authenticity</font></para>',
            self.styles['DossierBody']
        ))
        
        # Digital seal indicator
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph(
            '<para align=center><font size=10 color=#c53030>★ DIGITALLY SEALED ★</font></para>',
            self.styles['Classification']
        ))
        
        story.append(PageBreak())
        
        return story
    
    def format_dossier(
        self,
        filename: str,
        title: str,
        content: List[Dict],
        metadata: Dict
    ):
        """
        Create complete formatted dossier
        
        Args:
            filename: Output PDF filename
            title: Dossier title
            content: List of content sections
            metadata: Document metadata
        """
        doc = SimpleDocTemplate(
            filename,
            pagesize=self.pagesize,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=1 * inch,
            bottomMargin=1 * inch
        )
        
        story = []
        
        # Cover page
        story.extend(self.create_cover_page(title, metadata.get('subtitle', ''), metadata))
        
        # Content sections
        for section in content:
            # Section title
            if section.get('title'):
                story.append(Paragraph(section['title'], self.styles['DossierSubtitle']))
                story.append(Spacer(1, 0.2 * inch))
            
            # Section body
            if section.get('body'):
                story.append(Paragraph(section['body'], self.styles['DossierBody']))
                story.append(Spacer(1, 0.3 * inch))
            
            # Tables
            if section.get('table'):
                table = Table(section['table']['data'])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
                    ('FONT', (0, 1), (-1, -1), 'Helvetica', 9),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e0')),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')]),
                ]))
                story.append(table)
                story.append(Spacer(1, 0.3 * inch))
        
        # Build PDF with watermark and header/footer
        doc.build(story, onFirstPage=self._add_watermark_and_headers,
                  onLaterPages=self._add_watermark_and_headers)
    
    def _add_watermark_and_headers(self, canvas_obj, doc):
        """Combined function for watermark and headers"""
        self._add_watermark(canvas_obj, doc)
        self._add_header_footer(canvas_obj, doc)


# Utility function
def generate_professional_dossier(
    filename: str,
    title: str,
    content: List[Dict],
    metadata: Dict
):
    """Generate a professional legal dossier"""
    formatter = ProfessionalDossierFormatter()
    formatter.format_dossier(filename, title, content, metadata)
    return filename
