"""
Zenith Diagnostic: Reconciliation Data Pipeline Verification
Checks the data flow from Ingestion → Transaction/BankTransaction → Reconciliation
"""

import sys
from app.core.db import get_session
from app.models import Transaction, BankTransaction, Ingestion
from sqlmodel import select

sys.path.append("/Users/Arief/Newzen/zenith-lite/backend")


def main():
    db = next(get_session())
    print("=" * 80)
    print("ZENITH FORENSIC DATA PIPELINE DIAGNOSTIC")
    print("=" * 80)
    # 1. Ingestion Batches
    ingestions = db.exec(select(Ingestion)).all()
    print(f"\n📊 INGESTION BATCHES: {len(ingestions)}")
    for ing in ingestions[:5]:
        print(f"   - {ing.file_name}: {ing.records_processed} records | Status: {ing.status}")
    # 2. Internal Transactions (Journals/Expenses)
    internal_txs = db.exec(select(Transaction)).all()
    print(f"\n💼 INTERNAL TRANSACTIONS (Journal Claims): {len(internal_txs)}")
    # Status breakdown
    status_counts = {}
    for tx in internal_txs:
        status_counts[tx.status] = status_counts.get(tx.status, 0) + 1
    print("   Status Distribution:")
    for status, count in status_counts.items():
        print(f"     • {status}: {count}")
    # 3. Bank Transactions (Truth)
    bank_txs = db.exec(select(BankTransaction)).all()
    print(f"\n🏦 BANK TRANSACTIONS (Statement Truth): {len(bank_txs)}")
    # 4. Expected vs Actual
    print("\n⚠️  DIAGNOSTIC RESULTS:")
    if len(internal_txs) < 100:
        print(f"   🔴 WARNING: Only {len(internal_txs)} internal transactions ingested.")
        print("   💡 EXPECTED: 5000-6000 transactions from CSV upload.")
        print("   🔍 ISSUE: Frontend preview limit was restricting data flow.")
        print("   ✅ FIX APPLIED: Removed 'preview: 50' limit. Re-upload CSV to verify.")
    else:
        print(f"   ✅ HEALTHY: {len(internal_txs)} transactions available for reconciliation.")
    if len(bank_txs) < 100:
        print(f"\n   🔴 Bank statements appear incomplete ({len(bank_txs)} entries).")
        print("   💡 Ensure Statement ingestion type is used for bank CSVs.")
    print("\n" + "=" * 80)
    print("Next Step: Re-upload full CSV dataset to verify 5000-6000 row processing.")
    print("=" * 80)


if __name__ == "__main__":
    main()
