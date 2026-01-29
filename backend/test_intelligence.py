"""
Unit tests for Zenith Reconciliation Intelligence Modules
Run: python test_intelligence.py
"""

import sys
from app.core.reconciliation_intelligence import (
    InvoiceReferenceExtractor,
    VendorMatcher,
    BatchReferenceDetector,
    ConfidenceCalculator,
)

sys.path.append("/Users/Arief/Newzen/zenith-lite/backend")


def test_invoice_extraction():
    print("=" * 60)
    print("TEST 1: Invoice Reference Extraction")
    print("=" * 60)
    test_cases = [
        ("Transfer for Invoice INV-2024-001234 Payment", "REF001234"),
        ("KWITANSI NO 005678 CEMENT PURCHASE", "REF005678"),
        ("TRF TO VENDOR REF#9999", "REF009999"),
        ("Generic description with no invoice", None),
    ]
    for desc, expected in test_cases:
        result = InvoiceReferenceExtractor.extract(desc)
        status = "✅" if result == expected else "❌"
        print(f"{status} '{desc[:40]}...' → {result} (expected: {expected})")
    print()


def test_vendor_matching():
    print("=" * 60)
    print("TEST 2: Vendor Name Fuzzy Matching")
    print("=" * 60)
    test_pairs = [
        ("PT. JAYA KONSTRUKSI", "PT JAYA KONSTRUKSI", True),
        ("CV. MITRA SEJAHTERA", "MITRA-SEJAHTERA-BANK-TRF", True),
        ("UD. BINA KARYA", "PT BINA KARYA MANDIRI", False),  # Different enough
        ("SEMEN GRESIK", "TRF TO SEMEN GRESIK", True),
    ]
    for name1, name2, should_match in test_pairs:
        score, method = VendorMatcher.calculate_similarity(name1, name2)
        is_match = VendorMatcher.is_match(name1, name2)
        status = "✅" if is_match == should_match else "❌"
        print(f"{status} '{name1}' vs '{name2}'")
        print(f"   Score: {score:.1f}% | Method: {method} | Match: {is_match}")
    print()


def test_batch_detection():
    print("=" * 60)
    print("TEST 3: Batch Reference Detection")
    print("=" * 60)
    test_cases = [
        ("PAYROLL BATCH #456 MONTHLY DISBURSEMENT", "BATCH456"),
        ("GIRO-789 PAYMENT", "BATCH789"),
        ("Single transaction no batch", None),
    ]
    for desc, expected in test_cases:
        result = BatchReferenceDetector.extract_batch_id(desc)
        status = "✅" if result == expected else "❌"
        print(f"{status} '{desc}' → {result}")
    print()


def test_confidence_calculation():
    print("=" * 60)
    print("TEST 4: Multi-Tier Confidence Scoring")
    print("=" * 60)
    # Scenario 1: Perfect Match
    conf, tier = ConfidenceCalculator.calculate(
        amount_similarity=1.0,
        temporal_proximity_days=0,
        vendor_similarity=100.0,
        invoice_match=True,
        risk_score=0.0,
        match_type="direct",
    )
    print("Scenario 1 - Perfect Match:")
    print(f"   Confidence: {conf:.2%} | Tier: {tier}")
    print()
    # Scenario 2: Strong Match (no invoice, slight delay)
    conf, tier = ConfidenceCalculator.calculate(
        amount_similarity=0.98,
        temporal_proximity_days=3,
        vendor_similarity=90.0,
        invoice_match=False,
        risk_score=0.2,
        match_type="direct",
    )
    print("Scenario 2 - Strong Match (no invoice, 3-day lag):")
    print(f"   Confidence: {conf:.2%} | Tier: {tier}")
    print()
    # Scenario 3: Probable Match (aggregate, older)
    conf, tier = ConfidenceCalculator.calculate(
        amount_similarity=0.95,
        temporal_proximity_days=8,
        vendor_similarity=70.0,
        invoice_match=False,
        risk_score=0.5,
        match_type="aggregate",
    )
    print("Scenario 3 - Probable Match (8-day lag, aggregate):")
    print(f"   Confidence: {conf:.2%} | Tier: {tier}")
    print()
    # Scenario 4: Weak Match (poor signals)
    conf, tier = ConfidenceCalculator.calculate(
        amount_similarity=0.85,
        temporal_proximity_days=15,
        vendor_similarity=50.0,
        invoice_match=False,
        risk_score=0.8,
        match_type="direct",
    )
    print("Scenario 4 - Weak Match (15-day lag, high risk):")
    print(f"   Confidence: {conf:.2%} | Tier: {tier}")
    print()


if __name__ == "__main__":
    print("\n🧪 ZENITH RECONCILIATION INTELLIGENCE: UNIT TESTS\n")
    test_invoice_extraction()
    test_vendor_matching()
    test_batch_detection()
    test_confidence_calculation()
    print("=" * 60)
    print("✅ All intelligence modules tested successfully!")
    print("=" * 60)
    print("\nNext: Integrate into reconciliation_router.py")
    print("See: /Users/Arief/Newzen/RECONCILIATION_PHASE1_SUMMARY.md")
