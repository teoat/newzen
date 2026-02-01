"""
Jurisdictional Legal Templates - Zenith V3.0
Specialized templates for diverse legal standards and court submissions.
"""

LEGAL_TEMPLATES = {
    "ID_TPPU": {
        "title": "LAPORAN HASIL AUDIT FORENSIK (LHAF)",
        "statute": "Undang-Undang No. 8 Tahun 2010 tentang TPPU",
        "sections": [
            "IDENTITAS TERLAPOR",
            "MODUS OPERANDI (TIPOLOGI)",
            "ALUR ALIRAN DANA (FUND FLOW)",
            "KESIMPULAN INDIKASI PIDANA ASAL"
        ],
        "template": """
NOMOR LAPORAN: {report_id}
TANGGAL: {date}

Berdasarkan analisis algoritma Zenith Sovereign-X, ditemukan indikasi pelanggaran:
{findings_summary}

Pasal Terkait: {statute_reference}
Keyakinan Bukti (Prosecutorial Confidence): {confidence}%

DIOTORISASI OLEH: ZENITH AI JUDGE
"""
    },
    "SUBPOENA_EN": {
        "title": "SUBPOENA DUCES TECUM",
        "template": """
UNITED STATES DISTRICT COURT
Case No: {case_id}

TO: {recipient}

YOU ARE COMMANDED to produce at the time, date, and place set forth below the following documents, electronically stored information, or objects:
{document_requests}

DATED: {date}
AUTHORIZED BY: ZENITH FORENSIC PLATFORM
"""
    },
    "FREEZE_ID": {
        "title": "PENETAPAN PENYITAAN ASET",
        "template": """
KEJAKSAAN AGUNG REPUBLIK INDONESIA
SURAT PENETAPAN PENYITAAN

Menimbang indikasi pencucian uang pada perkara {case_title}, maka aset berikut ini dinyatakan BEKU (FROZEN):
{asset_list}

Ditetapkan pada: {date}
Oleh: ZENITH ADJUDICATION ENGINE
"""
    }
}
