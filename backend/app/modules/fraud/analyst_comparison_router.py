"""
Analyst Comparison Module (RAW MODE)
Independently analyzes raw bank statements using ONLY transaction fields.
No categories or pre-defined groupings - the app discovers patterns itself.
Then compares against user's analysis findings.
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from enum import Enum
import csv
import io
import re
from collections import Counter
from app.core.auth_middleware import verify_project_access
from app.models import Project

router = APIRouter(prefix="/forensic/{project_id}/analyst-comparison", tags=["Analyst Comparison"])
# Security: File upload limits
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_CSV_ROWS = 100_000  # Maximum rows per CSV


# ============================================================================
# MODELS
# ============================================================================
class VerdictType(str, Enum):
    PROJECT = "project"
    PERSONAL = "personal"
    SUSPICIOUS = "suspicious"
    DUPLICATE = "duplicate"
    INFLATED = "inflated"
    UNKNOWN = "unknown"


class AppFinding(BaseModel):
    """App's independent finding on a transaction."""

    row_no: int
    date: str
    raw_description: str
    amount: float
    verdict: VerdictType
    confidence: float
    discovered_patterns: List[str]
    reasoning: List[str]


class ComparisonResult(BaseModel):
    """Comparison between app's finding and user's finding."""

    row_no: int
    date: str
    description: str
    amount: float
    app_verdict: VerdictType
    app_reasoning: List[str]
    user_marked_as_project: bool
    user_comment: Optional[str]
    match_status: str


class ComparisonSummary(BaseModel):
    total_transactions: int
    agreed: int
    disagreed: int
    app_found_more: int
    user_found_more: int
    agreement_rate: float


class FullComparisonResponse(BaseModel):
    summary: ComparisonSummary
    comparisons: List[ComparisonResult]
    discovered_entities: Dict[str, int]
    discovered_patterns: Dict[str, int]


# ============================================================================
# RAW PATTERN DISCOVERY ENGINE
# ============================================================================
def parse_amount(value: str) -> float:
    """Parse Indonesian number format to float."""
    if not value:
        return 0.0
    cleaned = re.sub(r'[",\s]', "", str(value))
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def extract_names_from_description(desc: str) -> List[str]:
    """Extract potential entity names from raw description."""
    names = []
    # Common patterns in Indonesian bank descriptions
    patterns = [
        r"(?:KE|DARI|TO|FROM)\s+([A-Z][A-Z\s]+)",
        r"([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)",
    ]
    for pattern in patterns:
        matches = re.findall(pattern, desc.upper())
        names.extend([m.strip() for m in matches if len(m.strip()) > 3])
    return names


def discover_patterns_in_transaction(
    row: Dict[str, Any], all_descriptions: List[str], entity_frequency: Counter
) -> AppFinding:
    """
    Analyze a single transaction using ONLY raw fields.
    Discovers patterns independently without relying on categories.
    """
    findings = []
    reasoning = []
    verdict = VerdictType.UNKNOWN
    confidence = 0.5
    # Extract raw fields only
    row_no = int(row.get("No", 0) or 0)
    date = str(row.get("Tanggal", ""))
    raw_desc = str(row.get("Uraian", ""))
    desc_upper = raw_desc.upper()
    credit = parse_amount(row.get("Kredit", "0"))
    debit = parse_amount(row.get("Debit", "0"))
    amount = credit if credit > 0 else debit
    # =========================================
    # PATTERN 1: Repeated Entity Detection
    # =========================================
    names = extract_names_from_description(raw_desc)
    for name in names:
        if entity_frequency.get(name, 0) >= 5:
            findings.append("FREQUENT_RECIPIENT")
            reasoning.append(
                f"Entity '{name}' appears {entity_frequency[name]}x - "
                "could be legitimate vendor OR related party"
            )
    # =========================================
    # PATTERN 2: Cash Withdrawal Detection
    # =========================================
    cash_keywords = ["TARIKAN ATM", "WITHDRAWAL", "TUNAI", "CASH"]
    if any(kw in desc_upper for kw in cash_keywords):
        findings.append("CASH_WITHDRAWAL")
        reasoning.append("Cash withdrawal - funds become untraceable")
        verdict = VerdictType.SUSPICIOUS
        confidence = 0.7
    # =========================================
    # PATTERN 3: Round Amount Pattern
    # =========================================
    if amount > 0:
        if amount >= 10_000_000 and amount % 1_000_000 == 0:
            findings.append("ROUND_MILLIONS")
            reasoning.append(
                f"Perfectly round amount ({amount/1_000_000:.0f}M) - "
                "legitimate transactions often have irregular amounts"
            )
            if verdict == VerdictType.UNKNOWN:
                verdict = VerdictType.SUSPICIOUS
                confidence = 0.6
        if amount >= 100_000_000 and amount % 50_000_000 == 0:
            findings.append("LARGE_ROUND_AMOUNT")
            reasoning.append(
                f"Large round amount ({amount/1_000_000:.0f}M) - " "high-risk transaction pattern"
            )
            verdict = VerdictType.SUSPICIOUS
            confidence = 0.8
    # =========================================
    # PATTERN 4: Similar Description Detection
    # =========================================
    similar_count = sum(
        1 for d in all_descriptions if d != raw_desc and _similarity(raw_desc, d) > 0.8
    )
    if similar_count >= 2:
        findings.append("SIMILAR_DESCRIPTIONS")
        reasoning.append(
            f"Found {similar_count} transactions with very similar "
            "descriptions - possible duplicates"
        )
        if verdict == VerdictType.UNKNOWN:
            verdict = VerdictType.DUPLICATE
            confidence = 0.7
    # =========================================
    # PATTERN 5: Transfer Keywords
    # =========================================
    transfer_keywords = ["TRSF", "TRANSFER", "TRF", "SWITCHING"]
    if any(kw in desc_upper for kw in transfer_keywords):
        # Check if it's internal
        internal_hints = ["KE REK", "PINDAH", "ANTAR REK"]
        if any(h in desc_upper for h in internal_hints):
            findings.append("INTERNAL_TRANSFER")
            reasoning.append("Transfer between accounts - verify not circulating funds")
            if verdict == VerdictType.UNKNOWN:
                verdict = VerdictType.SUSPICIOUS
                confidence = 0.65
    # =========================================
    # PATTERN 6: Personal Name Patterns
    # =========================================
    # Look for names that repeat with slight variations
    name_parts = re.findall(r"\b([A-Z]{3,})\b", desc_upper)
    for part in name_parts:
        variations = [n for n in entity_frequency.keys() if part in n and n != part]
        if len(variations) >= 2:
            findings.append("NAME_VARIATIONS")
            reasoning.append(
                f"Name '{part}' appears in multiple variations - " "possible related party network"
            )
            if verdict == VerdictType.UNKNOWN:
                verdict = VerdictType.PERSONAL
                confidence = 0.6
            break
    # =========================================
    # PATTERN 7: High-Value Transaction
    # =========================================
    if amount >= 50_000_000:
        findings.append("HIGH_VALUE")
        reasoning.append(
            f"High-value transaction ({amount/1_000_000:.0f}M IDR) - "
            "requires additional scrutiny"
        )
        confidence = min(confidence + 0.1, 1.0)
    # =========================================
    # Default: No patterns found
    # =========================================
    if not findings:
        verdict = VerdictType.PROJECT
        confidence = 0.5
        reasoning.append("No suspicious patterns detected in raw data")
    return AppFinding(
        row_no=row_no,
        date=date,
        raw_description=raw_desc,
        amount=amount,
        verdict=verdict,
        confidence=confidence,
        discovered_patterns=findings,
        reasoning=reasoning,
    )


def _similarity(a: str, b: str) -> float:
    """Simple similarity ratio between two strings."""
    if not a or not b:
        return 0.0
    a, b = a.lower(), b.lower()
    matches = sum(1 for ca, cb in zip(a, b) if ca == cb)
    return matches / max(len(a), len(b))


# ============================================================================
# API ENDPOINTS
# ============================================================================
@router.post("/analyze-raw")
async def analyze_raw_bank_statement(
    project_id: str, file: UploadFile = File(...), project: Project = Depends(verify_project_access)
):
    """
    Analyze raw bank statement - discovers patterns without categories.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV supported")
    content = await file.read()
    decoded = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))
    rows = list(reader)
    # Pre-process: collect all descriptions and entity frequencies
    all_descriptions = [str(r.get("Uraian", "")) for r in rows]
    # Security: Validate row count
    if len(rows) > MAX_CSV_ROWS:
        raise HTTPException(
            status_code=413,
            detail=f"Too many rows: {len(rows)}. Maximum is {MAX_CSV_ROWS}",
        )
    entity_frequency: Counter = Counter()
    for desc in all_descriptions:
        names = extract_names_from_description(desc)
        entity_frequency.update(names)
    # Analyze each transaction
    results = []
    for row in rows:
        if row.get("No"):
            finding = discover_patterns_in_transaction(row, all_descriptions, entity_frequency)
            results.append(finding)
    # Aggregate discovered patterns
    pattern_counts: Counter = Counter()
    for r in results:
        pattern_counts.update(r.discovered_patterns)
    verdict_counts = Counter(r.verdict.value for r in results)
    return {
        "total_analyzed": len(results),
        "verdicts": dict(verdict_counts),
        "discovered_patterns": dict(pattern_counts),
        "top_entities": dict(entity_frequency.most_common(20)),
        "flagged_count": len([r for r in results if r.verdict != VerdictType.PROJECT]),
        "sample_findings": [r.dict() for r in results[:50]],
    }


@router.post("/compare", response_model=FullComparisonResponse)
async def compare_with_user_analysis(
    project_id: str,
    bank_statement: UploadFile = File(...),
    user_analysis: UploadFile = File(...),
    project: Project = Depends(verify_project_access),
):
    """
    Compare app's raw pattern discovery against user's analysis.
    User's analysis only needs: No, Proyek (TRUE/FALSE), Comment
    """
    # Parse bank statement
    bank_content = await bank_statement.read()
    bank_decoded = bank_content.decode("utf-8", errors="ignore")
    bank_reader = csv.DictReader(io.StringIO(bank_decoded))
    bank_rows = list(bank_reader)
    # Pre-process for pattern discovery
    all_descriptions = [str(r.get("Uraian", "")) for r in bank_rows]
    # Security: Validate row count
    if len(bank_rows) > MAX_CSV_ROWS:
        raise HTTPException(
            status_code=413,
            detail=f"Too many rows: {len(bank_rows)}. Max: {MAX_CSV_ROWS}",
        )
    entity_frequency: Counter = Counter()
    for desc in all_descriptions:
        entity_frequency.update(extract_names_from_description(desc))
    # Build app findings
    app_findings: Dict[int, AppFinding] = {}
    for row in bank_rows:
        if row.get("No"):
            finding = discover_patterns_in_transaction(row, all_descriptions, entity_frequency)
            app_findings[finding.row_no] = finding
    # Parse user analysis (only need: No, Proyek, Comment)
    user_content = await user_analysis.read()
    user_decoded = user_content.decode("utf-8", errors="ignore")
    user_reader = csv.DictReader(io.StringIO(user_decoded))
    user_verdicts: Dict[int, Dict[str, Any]] = {}
    for row in user_reader:
        row_no = int(row.get("No", 0) or 0)
        if row_no > 0:
            is_project = str(row.get("Proyek", "")).upper() == "TRUE"
            user_verdicts[row_no] = {
                "is_project": is_project,
                "comment": row.get("Comment", ""),
            }
    # Compare
    comparisons = []
    agreed = 0
    disagreed = 0
    all_row_nos = set(app_findings.keys()) & set(user_verdicts.keys())
    for row_no in sorted(all_row_nos):
        app = app_findings[row_no]
        user = user_verdicts[row_no]
        # Determine match
        app_says_project = app.verdict == VerdictType.PROJECT
        user_says_project = user["is_project"]
        if app_says_project == user_says_project:
            match_status = "agree"
            agreed += 1
        else:
            match_status = "disagree"
            disagreed += 1
        comparisons.append(
            ComparisonResult(
                row_no=row_no,
                date=app.date,
                description=app.raw_description,
                amount=app.amount,
                app_verdict=app.verdict,
                app_reasoning=app.reasoning,
                user_marked_as_project=user_says_project,
                user_comment=user.get("comment"),
                match_status=match_status,
            )
        )
    # Aggregate all discovered patterns
    all_patterns: Counter = Counter()
    for f in app_findings.values():
        all_patterns.update(f.discovered_patterns)
    summary = ComparisonSummary(
        total_transactions=len(all_row_nos),
        agreed=agreed,
        disagreed=disagreed,
        app_found_more=len(app_findings) - len(all_row_nos),
        user_found_more=len(user_verdicts) - len(all_row_nos),
        agreement_rate=agreed / len(comparisons) if comparisons else 0,
    )
    return FullComparisonResponse(
        summary=summary,
        comparisons=comparisons[:200],
        discovered_entities=dict(entity_frequency.most_common(30)),
        discovered_patterns=dict(all_patterns),
    )


@router.post("/quick-scan")
async def quick_scan(
    project_id: str, file: UploadFile = File(...), project: Project = Depends(verify_project_access)
):
    """
    Quick pattern scan - just returns discovered patterns and entities.
    """
    result = await analyze_raw_bank_statement(project_id, file, project)
    return {
        "patterns_found": result["discovered_patterns"],
        "top_entities": result["top_entities"],
        "flagged_transactions": result["flagged_count"],
        "total": result["total_analyzed"],
    }
