"""
Zenith Reconciliation Intelligence Module
Advanced matching utilities for forensic transaction reconciliation
"""

import re
from typing import Optional, Tuple, Dict, Any
from thefuzz import fuzz
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models import Transaction


class InvoiceReferenceExtractor:
    """
    Extracts invoice/reference numbers from transaction descriptions
    using pattern matching and NLP heuristics.
    """

    # Common invoice patterns in Indonesian/English contexts
    PATTERNS = [
        r"INV[-_#\s]*(\d{4,})",  # INV-2024-001, INV#001234
        r"INVOICE[-_#\s]*(\d{4,})",
        r"NO[-_.\s]*(\d{4,})",  # NO. 001234, NO_001234
        r"REF[-_#\s]*(\d{4,})",  # REF-123456
        r"TRF[-_#\s]*(\d{4,})",  # Bank transfer reference
        r"KWITANSI[-_#\s]*(\d{4,})",  # Indonesian receipt
        r"SPK[-_#\s]*(\d{4,})",  # Surat Perintah Kerja
        r"PO[-_#\s]*(\d{4,})",  # Purchase Order
    ]

    @classmethod
    def extract(cls, text: str) -> Optional[str]:
        """
        Extract the most likely invoice/reference number from text.
        Args:
            text: Transaction description or memo
        Returns:
            Normalized reference number or None
        """
        if not text:
            return None
        text_upper = text.upper()
        for pattern in cls.PATTERNS:
            match = re.search(pattern, text_upper)
            if match:
                # Return normalized format: remove special chars, pad zeros
                ref_num = match.group(1)
                return f"REF{ref_num.zfill(6)}"  # Normalize to REF000123
        return None


class VendorMatcher:
    """
    Fuzzy matching for vendor/entity names to handle aliases and typos.
    """

    SIMILARITY_THRESHOLD = 80  # Minimum % similarity to consider a match

    @classmethod
    def normalize_name(cls, name: str) -> str:
        """
        Normalize vendor name for comparison.
        - Remove legal suffixes (PT, CV, UD)
        - Remove punctuation
        - Standardize spacing
        """
        if not name:
            return ""
        normalized = name.upper()
        # Remove common legal entity prefixes/suffixes
        legal_terms = ["PT", "CV", "UD", "TBK", "LTD", "INC", "CORP"]
        for term in legal_terms:
            normalized = re.sub(rf"\b{term}\.?\b", "", normalized)
        # Remove special characters, keep alphanumeric and space
        normalized = re.sub(r"[^\w\s]", "", normalized)
        # Collapse multiple spaces
        normalized = " ".join(normalized.split())
        return normalized.strip()

    @classmethod
    def calculate_similarity(cls, name1: str, name2: str) -> Tuple[float, str]:
        """
        Calculate similarity score between two vendor names.
        Returns:
            (similarity_score, match_method)
        """
        if not name1 or not name2:
            return (0.0, "missing_data")
        norm1 = cls.normalize_name(name1)
        norm2 = cls.normalize_name(name2)
        # Exact match after normalization
        if norm1 == norm2:
            return (100.0, "exact_normalized")
        # Fuzzy matching using multiple algorithms
        ratio = fuzz.ratio(norm1, norm2)
        partial = fuzz.partial_ratio(norm1, norm2)
        token_sort = fuzz.token_sort_ratio(norm1, norm2)
        # Use the highest score
        best_score = max(ratio, partial, token_sort)
        if best_score >= 95:
            method = "fuzzy_high"
        elif best_score >= cls.SIMILARITY_THRESHOLD:
            method = "fuzzy_probable"
        else:
            method = "fuzzy_weak"
        return (best_score, method)

    @classmethod
    def is_match(cls, name1: str, name2: str) -> bool:
        """Quick boolean check if names match above threshold."""
        score, _ = cls.calculate_similarity(name1, name2)
        return score >= cls.SIMILARITY_THRESHOLD


class BatchReferenceDetector:
    """
    Detects batch/group payment references in bank statements.
    """

    BATCH_PATTERNS = [
        r"BATCH[-_#\s]*(\d+)",
        r"PAYROLL[-_#\s]*(\d+)",
        r"PAYMENT[-_#\s]*GROUP[-_#\s]*(\d+)",
        r"GIRO[-_#\s]*(\d+)",
        r"CEK[-_#\s]*(\d+)",
    ]

    @classmethod
    def extract_batch_id(cls, description: str) -> Optional[str]:
        """Extract batch identifier from bank transaction description."""
        if not description:
            return None
        desc_upper = description.upper()
        for pattern in cls.BATCH_PATTERNS:
            match = re.search(pattern, desc_upper)
            if match:
                return f"BATCH{match.group(1)}"
        return None


class SemanticMatcher:
    """
    Advanced semantic matching for transaction descriptions.
    Uses Gemini 2.0 Flash to understand conceptual similarity.
    """
    @staticmethod
    def calculate_similarity(desc1: str, desc2: str) -> float:
        """
        Calculate concept-based similarity using Gemini.
        Returns: 0.0 to 1.0
        """
        if not desc1 or not desc2: return 0.0
        if desc1.lower() == desc2.lower(): return 1.0
        
        # Quick fallback to fuzzy if Gemini is not available/configured
        # or for minor string differences
        f_ratio = fuzz.token_sort_ratio(desc1.lower(), desc2.lower()) / 100.0
        if f_ratio > 0.85: return f_ratio

        try:
            import google.generativeai as genai
            from app.core.config import settings
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            prompt = f"""
            Compare these two transaction descriptions and determine if they refer to the same event/purchase.
            Desc A: "{desc1}"
            Desc B: "{desc2}"
            Respond with ONLY a number between 0.0 and 1.0 (confidence score).
            """
            response = model.generate_content(prompt)
            return float(response.text.strip())
        except:
            return f_ratio


class CurrencyService:
    """
    Handles exchange rate conversion for multi-currency reconciliation.
    """
    @staticmethod
    def get_rate(from_curr: str, to_curr: str) -> float:
        """
        Fetch current exchange rate. Defaults to IDR-USD baseline.
        """
        if from_curr == to_curr: return 1.0
        # In a real system, call exchangerate-api.com
        # Baseline for Aldi case
        rates = {
            "USD_IDR": 15700.0,
            "EUR_IDR": 17000.0,
            "SGD_IDR": 11500.0
        }
        key = f"{from_curr}_{to_curr}".upper()
        return rates.get(key, 1.0)


class ConfidenceCalculator:
    """
    Multi-factor confidence scoring for reconciliation matches.
    """

    @staticmethod
    def calculate(
        amount_similarity: float,
        temporal_proximity_days: float,
        vendor_similarity: float = 0.0,
        semantic_similarity: float = 0.0,
        invoice_match: bool = False,
        batch_match: bool = False,
        risk_score: float = 0.0,
        match_type: str = "direct",
    ) -> Tuple[float, str]:
        """
        Calculate confidence score for a reconciliation match.
        """
        # Base scoring weights
        score = 0.0
        # 1. Amount (40% weight)
        score += 0.40 * amount_similarity
        # 2. Temporal (20% weight) - exponential decay
        if temporal_proximity_days <= 1:
            temporal_score = 1.0
        elif temporal_proximity_days <= 3:
            temporal_score = 0.9
        elif temporal_proximity_days <= 7:
            temporal_score = 0.7
        elif temporal_proximity_days <= 14:
            temporal_score = 0.4
        else:
            temporal_score = 0.2
        score += 0.20 * temporal_score
        # 3. Vendor similarity (10% weight)
        if vendor_similarity > 0:
            score += 0.10 * (vendor_similarity / 100)
        # 4. Semantic Description similarity (5% weight)
        if semantic_similarity > 0:
            score += 0.05 * (semantic_similarity / 100)
        # 5. Reference matches (20% weight)
        if invoice_match:
            score += 0.10
        if batch_match:
            score += 0.15  # Batch match is very strong
        # 6. Match type factor (5% weight)
        if match_type == "direct":
            score += 0.05
        # 7. Risk penalty (up to -10%)
        risk_penalty = min(0.10, risk_score * 0.10)
        score -= risk_penalty
        # Clamp to 0-1 range
        score = max(0.0, min(1.0, score))
        # Determine tier
        if score >= 0.95:
            tier = "TIER_1_PERFECT"
        elif score >= 0.85:
            tier = "TIER_2_STRONG"
        elif score >= 0.70:
            tier = "TIER_3_PROBABLE"
        else:
            tier = "TIER_4_WEAK"
        return (score, tier)


class VelocityAnalyzer:
    """
    Analyzes transaction velocity to detect structuring and clearing anomalies.
    """

    @staticmethod
    def analyze_velocity(db: Session, entity_name: str, lookback_days: int = 30) -> Dict[str, Any]:
        """
        Analyze transaction velocity for a specific entity.
        Returns metrics like avg_daily_tx, clearing_time_drift, max_daily_volume.
        """
        if not entity_name or entity_name == "Unknown":
            return {}
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=lookback_days)
        # Fetch transactions for entity in lookback period
        txs = db.exec(
            select(Transaction)
            .where(Transaction.receiver == entity_name, Transaction.timestamp >= start_date)
            .order_by(Transaction.timestamp)
        ).all()
        if not txs:
            return {"status": "no_data"}
        # 1. Volume Spikes (Max tx per day)
        daily_counts = {}
        for tx in txs:
            date_key = tx.timestamp.date()
            daily_counts[date_key] = daily_counts.get(date_key, 0) + 1
        max_daily = max(daily_counts.values()) if daily_counts else 0
        avg_daily = len(txs) / lookback_days
        # 2. Structuring Detection (Transactions just below reporting threshold)
        structuring_count = sum(1 for tx in txs if 90_000_000 <= tx.actual_amount < 100_000_000)
        # 3. Burst Detection
        is_bursting = max_daily > (avg_daily * 5) and max_daily > 3
        return {
            "entity": entity_name,
            "total_tx_30d": len(txs),
            "max_daily_tx": max_daily,
            "avg_daily_tx": round(avg_daily, 2),
            "structuring_attempts": structuring_count,
            "velocity_risk": ("HIGH" if is_bursting or structuring_count > 0 else "NORMAL"),
        }


def extract_all_references(tx_description: str) -> Dict[str, Any]:
    """
    Extract all identifiable references from a transaction description.
    Convenience function for comprehensive parsing.
    """
    return {
        "invoice_ref": InvoiceReferenceExtractor.extract(tx_description),
        "batch_ref": BatchReferenceDetector.extract_batch_id(tx_description),
        "original_text": tx_description,
    }
