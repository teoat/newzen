"""
RAB Service V2: High-Performance Budget Forensic Engine.
Optimized for Batch Processing and Advanced Variance Analysis.
"""
from typing import Dict, Any
import pandas as pd
from sqlmodel import Session, select
from app.models import BudgetLine, Transaction
from app.modules.forensic.ingestion_service import IngestionService
import logging

logger = logging.getLogger(__name__)

class RABServiceV2:
    def __init__(self, db: Session):
        self.db = db
        self.ingestion_service = IngestionService(db)

    async def recalculate_variance_v2(self, project_id: str) -> Dict[str, Any]:
        """
        V2 Optimized Re-calculation.
        Uses Batch Fetching + Pandas In-Memory Join to eliminate N+1 queries.
        Reduces complexity from O(N*M) queries to O(1) query + O(N*M) memory op.
        """
        logger.info(f"Starting V2 Variance Calculation for Project {project_id}")
        
        # 1. Batch Fetch Data (2 Queries Total)
        budget_lines = self.db.exec(
            select(BudgetLine).where(BudgetLine.project_id == project_id)
        ).all()
        
        transactions = self.db.exec(
            select(Transaction).where(Transaction.project_id == project_id)
        ).all()

        if not budget_lines:
            return {"status": "no_data", "message": "No budget lines found."}

        # 2. Convert to Pandas DataFrames
        pd.DataFrame([b.dict() for b in budget_lines])
        
        if not transactions:
            # optimize: if no txns, reset all actuals to 0 efficiently
            logger.info("No transactions found. Resetting actuals.")
            for bl in budget_lines:
                bl.qty_actual = 0.0
                bl.total_spend_actual = 0.0
                bl.avg_unit_price_actual = 0.0
                bl.markup_percentage = 0.0
                bl.volume_discrepancy = 0.0 - (bl.qty_cco if bl.qty_cco > 0 else bl.qty_rab)
                self.db.add(bl)
            self.db.commit()
            
            # V4 Auto-Scan for Asset Risks
            await self._scan_and_flag_missing_assets(project_id)
            
            return {"status": "success", "updated": len(budget_lines), "mode": "reset"}

        df_tx = pd.DataFrame([{
            "tx_id": t.id,
            "desc": str(t.description).upper(),
            "amount": t.actual_amount,
            "qty": t.quantity or 0.0,
            "category": t.category_code
        } for t in transactions])

        # 3. Vectorized Fuzzy Matching (Memory Optimized)
        # We broadcast budget item names against transaction descriptions
        updated_lines = []
        
        # Pre-process descriptions for speed
        # Simple containment check optimization
        
        for bl in budget_lines:
            # Criteria keywords
            keywords = [bl.item_name.upper()]
            if bl.item_code:
                keywords.append(bl.item_code.upper())
            
            # Filter Transactions matching ANY keyword
            # Using regex for vectorized containment check
            pattern = '|'.join(map(lambda x: pd.isna(x) or str(x), keywords)) 
            # Note: In a real persistent v2, we'd use a dedicated 'Material_Map' table
            # to avoid this string matching every time.
            
            # Pandas boolean mask
            mask = df_tx['desc'].str.contains(pattern, case=False, na=False, regex=False)
            matched_tx = df_tx[mask]
            
            if matched_tx.empty:
                bl.qty_actual = 0.0
                bl.total_spend_actual = 0.0
            else:
                total_qty = matched_tx['qty'].sum()
                total_amt = matched_tx['amount'].sum()
                
                bl.qty_actual = float(total_qty)
                bl.total_spend_actual = float(total_amt)
                bl.avg_unit_price_actual = (total_amt / total_qty) if total_qty > 0 else 0.0
            
            # 4. Calculate Variances (Pure Math)
            baseline_price = bl.unit_price_cco if bl.unit_price_cco > 0 else bl.unit_price_rab
            baseline_qty = bl.qty_cco if bl.qty_cco > 0 else bl.qty_rab
            
            if baseline_price > 0:
                bl.markup_percentage = ((bl.avg_unit_price_actual - baseline_price) / baseline_price) * 100
            
            bl.volume_discrepancy = bl.qty_actual - baseline_qty
            
            # 5. Logic Gates
            vol_threshold = baseline_qty * 0.15
            bl.requires_justification = (
                abs(bl.markup_percentage) > 10 or 
                abs(bl.volume_discrepancy) > vol_threshold
            )
            
            updated_lines.append(bl)
            
        # 6. Bulk Save
        # self.db.add_all(updated_lines) # SQLModel doesn't support add_all same way always
        for line in updated_lines:
            self.db.add(line)
        
        self.db.commit()
        
        # V4 Auto-Scan for Asset Risks (Parity with V1)
        await self._scan_and_flag_missing_assets(project_id)

        logger.info(f"V2 Calculation Complete for {len(updated_lines)} lines.")
        return {
            "status": "success",
            "updated_count": len(updated_lines),
            "performance_mode": "batch_v2"
        }

    async def _scan_and_flag_missing_assets(self, project_id: str):
        """
        Internal: Checks for missing CAPEX assets and raises AuditLog flags.
        """
        from app.modules.forensic.rab_service import RABService
        from app.models import AuditLog
        
        service_v1 = RABService(self.db)
        asset_report = service_v1.calculate_non_perishable_assets(project_id)
        
        print(f"DEBUG: Scanning {len(asset_report.get('assets', []))} assets for project {project_id}")
        for asset in asset_report.get("assets", []):
            print(f"DEBUG: Asset: {asset['item_name']}, status: {asset['status']}, val: {asset['total_value']}")
            if asset["status"] == "MISSING" and asset["total_value"] > 10000000: # Threshold 10jt
                # Check for existing active flag to avoid spam
                existing = self.db.exec(
                    select(AuditLog).where(
                        AuditLog.entity_id == str(asset["id"]),
                        AuditLog.action == "RISK_FLAG",
                        AuditLog.new_value == "UNVERIFIED_CAPEX_ASSET"
                    )
                ).first()
                
                if not existing:
                    print(f"DEBUG: Creating AuditLog for {asset['item_name']}")
                    log = AuditLog(
                        entity_type="BudgetLine",
                        entity_id=str(asset["id"]),
                        action="RISK_FLAG",
                        field_name="status",
                        old_value="PLANNED",
                        new_value="UNVERIFIED_CAPEX_ASSET",
                        change_reason=f"Missing CAPEX Asset: {asset['item_name']} ({asset['category']})",
                        changed_by_user_id="SYSTEM_FORENSIC_BOT"
                    )
                    self.db.add(log)
                else:
                    print(f"DEBUG: AuditLog already exists for {asset['item_name']}")
        
        self.db.commit()
