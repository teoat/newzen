"""
Reconciliation Engine V2: The 'Waterfall' Matching Brain.
Orchestrates multi-pass logic to match Bank Transactions with Internal Ledger entries.
"""
from typing import Dict, Any
from sqlmodel import Session, select
from app.models import (
    Transaction, 
    TransactionSource,
    ReconciliationMatch
)
from app.core.reconciliation_intelligence import (
    VendorMatcher, 
    InvoiceReferenceExtractor, 
    ConfidenceCalculator
)
import logging

logger = logging.getLogger(__name__)

class ReconciliationEngineV2:
    def __init__(self, db: Session):
        self.db = db

    def run_waterfall_match(self, project_id: str) -> Dict[str, Any]:
        """
        Executes the Waterfall Matching Algorithm:
        1. Exact Match (Amount + Date + Ref)
        2. Fuzzy Match (Amount + Vendor Name)
        3. Thinning Match (Many-to-One Sum)
        """
        results = {
            "pass_1_exact": 0,
            "pass_2_fuzzy": 0,
            "pass_3_thinning": 0,
            "total_matches": 0
        }
        
        # Fetch UNMATCHED records
        # Note: In a real system, we'd filter out IDs present in ReconciliationMatch table
        # optimized via LEFT JOIN or NOT IN subquery
        
        # Get already matched IDs
        matched_ledger_ids = self.db.exec(select(ReconciliationMatch.internal_tx_id)).all()
        matched_bank_ids = self.db.exec(select(ReconciliationMatch.bank_tx_id)).all()
        
        # Optimize: Fetch only necessary fields or objects
        # Fetch Ledgers
        ledgers = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .where(Transaction.source_type == TransactionSource.INTERNAL_LEDGER)
            .where(Transaction.id.not_in(matched_ledger_ids))
        ).all()
        
        # Fetch Bank Txns
        bank_txns = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .where(Transaction.source_type == TransactionSource.BANK_STATEMENT)
            .where(Transaction.id.not_in(matched_bank_ids))
        ).all()
        
        if not ledgers or not bank_txns:
        
            return results

        # --- PASS 1: EXACT MATCH (Confidence > 95%) ---
        # Criteria: Exact Amount AND (Ref Match OR (Date < 2 days diff AND Vendor Match))
        
        # Index bank txns by amount for O(1) lookup
        bank_map_amount = {}
        for b in bank_txns:
            amt = float(b.verified_amount)
            if amt not in bank_map_amount:
                bank_map_amount[amt] = []
            bank_map_amount[amt].append(b)
            
        for ledger in ledgers:
            # Skip if matched in this run
            if ledger.id in matched_ledger_ids:
                continue
                
            l_amt = float(ledger.verified_amount)
            candidates = bank_map_amount.get(l_amt, [])
            
            for bank in candidates:
                if bank.id in matched_bank_ids:
                    continue
                    
                # Check 1: Invoice Ref
                l_ref = InvoiceReferenceExtractor.extract(ledger.description)
                b_ref = InvoiceReferenceExtractor.extract(bank.description)
                
                is_ref_match = (l_ref and b_ref and l_ref == b_ref)
                
                # Check 2: Date Proximity
                diff = abs((ledger.transaction_date - bank.transaction_date).days)
                
                # Check 3: Vendor Name
                is_vendor_match = VendorMatcher.is_match(ledger.receiver, bank.description)
                
                confidence = 0.0
                reason = ""
                
                if is_ref_match:
                
                    confidence = 0.99
                    reason = f"Exact Ref Match: {l_ref}"
                elif diff <= 2 and is_vendor_match:
                    confidence = 0.95
                    reason = "Exact Amount + Vendor + Date"
                elif diff == 0 and not is_vendor_match:
                    # Same day, same amount, but description differs
                    confidence = 0.85
                    reason = "Same Day + Exact Amount"
                
                if confidence > 0.80:
                
                    self._create_match(ledger, bank, confidence, reason, "waterfall_p1")
                    matched_ledger_ids.append(ledger.id)
                    matched_bank_ids.append(bank.id)
                    results["pass_1_exact"] += 1
                    break # Matched this ledger, move to next
        
        # --- PASS 2: FUZZY MATCH (Confidence > 70%) ---
        # Relaxed Amount (overhead striping) or Vendor Fuzzy
        
        # Re-fetch or filter remaining? 
        # For V2 POC, we iterate remaining using sets for speed
        rem_ledgers = [line_item for line_item in ledgers if line_item.id not in matched_ledger_ids]
        rem_banks = [b for b in bank_txns if b.id not in matched_bank_ids]
        
        for ledger in rem_ledgers:
            best_match = None
            best_score = 0.0
            
            l_amt = float(ledger.verified_amount)
            
            for bank in rem_banks:
                if bank.id in matched_bank_ids:
                    continue
                
                # Amount Similarity (Strip VAT? +/- 1%?)
                b_amt = float(bank.verified_amount)
                amt_ratio = min(l_amt, b_amt) / max(l_amt, b_amt) if max(l_amt, b_amt) > 0 else 0
                
                if amt_ratio < 0.9:
                
                    continue # Skip if amounts wildly different
                
                # Vendor Similarity
                v_score, _ = VendorMatcher.calculate_similarity(ledger.receiver, bank.description)
                
                # Date
                diff = abs((ledger.transaction_date - bank.transaction_date).days)
                
                # Calculate Composite Score
                score, _ = ConfidenceCalculator.calculate(
                    amount_similarity=amt_ratio,
                    temporal_proximity_days=diff,
                    vendor_similarity=v_score
                )
                
                if score > best_score and score > 0.70:
                
                    best_score = score
                    best_match = bank
            
            if best_match:
            
                self._create_match(ledger, best_match, best_score, "Fuzzy Composite Score", "waterfall_p2")
                matched_ledger_ids.append(ledger.id)
                matched_bank_ids.append(best_match.id)
                results["pass_2_fuzzy"] += 1

        # --- PASS 3: THINNING (Aggregate) ---
        # Logic: Find set of Bank Txns that sum up to 1 Ledger (e.g., split payments)
        # This is a version of the Subset Sum Problem (NP-Complete), so we limit scanning.
        
        rem_ledgers = [line_item for line_item in ledgers if line_item.id not in matched_ledger_ids]
        rem_banks = [b for b in bank_txns if b.id not in matched_bank_ids]
        
        # Heuristic: Only look for sums within small time window (3 days)
        for ledger in rem_ledgers:
            l_amt = float(ledger.verified_amount)
            
            # Find localized bank txns
            candidates = [
                b for b in rem_banks 
                if abs((b.transaction_date - ledger.transaction_date).days) <= 3
                and float(b.verified_amount) < l_amt
            ]
            
            # Try finding 2 or 3 items that sum to l_amt
            found_combo = []
            
            # 2-Sum
            for i, b1 in enumerate(candidates):
                for b2 in candidates[i+1:]:
                    if abs((float(b1.verified_amount) + float(b2.verified_amount)) - l_amt) < 1.0: # Tolerance
                        found_combo = [b1, b2]
                        break
                if found_combo:
                    break
            
            if found_combo:
                # Create multiple matches linked to one ledger (Not supported by current schema 1-to-1?)
                # If schema is 1-to-1, we can't fully store this. 
                # Assuming schema allows one ledger -> multiple matches rows
                for b in found_combo:
                    self._create_match(ledger, b, 0.85, "Aggregate Sum Match (2-part)", "waterfall_p3")
                    matched_bank_ids.append(b.id)
                matched_ledger_ids.append(ledger.id)
                results["pass_3_thinning"] += 1

        self.db.commit()
        results["total_matches"] = results["pass_1_exact"] + results["pass_2_fuzzy"] + results["pass_3_thinning"]
        return results

    def _create_match(self, ledger, bank, score, reason, type_code):
        match = ReconciliationMatch(
            internal_tx_id=ledger.id,
            bank_tx_id=bank.id,
            confidence_score=score,
            ai_reasoning=reason,
            match_type=type_code,
            verified_by_user_id="SYSTEM_V2_ENGINE"
        )
        self.db.add(match)
