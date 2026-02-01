"""
RAB (Rencana Anggaran Biaya) Service.
Handles budget upload, parsing, variance calculation, and analysis.
"""
from typing import Dict, Any, List, Optional
from pathlib import Path
import pandas as pd
from sqlmodel import Session, select
from app.models import BudgetLine, Transaction, AuditLog
from app.modules.forensic.ingestion_service import IngestionService
from app.modules.forensic.vision_service import VisionService


class RABService:
    # v4.0 Settlement Heuristics: Material Intensity & Engineering Ratios
    _MATERIAL_INTENSITY_MATRIX = {
        "BETON": {
            "material_ratio": 0.65,
            "cement_kg_m3": 384,
            "steel_kg_m3": 110,
            "sand_kg_m3": 692,
            "stone_kg_m3": 1039
        },
        "CONCRETE": {
            "material_ratio": 0.65,
            "cement_kg_m3": 384,
            "steel_kg_m3": 110,
            "sand_kg_m3": 692,
            "stone_kg_m3": 1039
        },
        "BESI": {"material_ratio": 0.85, "steel_kg_m3": 0},
        "STEEL": {"material_ratio": 0.85, "steel_kg_m3": 0},
        "ASPAL": {"material_ratio": 0.75, "bitumen_pct": 0.057},
        "ASPHALT": {"material_ratio": 0.75, "bitumen_pct": 0.057},
        "DEFAULT": {"material_ratio": 0.50}
    }

    def __init__(self, db: Session):
        self.db = db
        self.ingestion_service = IngestionService(db)
        self.vision_service = VisionService(db)

    async def upload_and_parse_rab(
        self,
        file_path: str,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Upload and parse RAB file (Excel or PDF).

        Returns summary of imported budget lines.
        """
        file_ext = Path(file_path).suffix.lower()

        result = {}
        if file_ext in ['.xlsx', '.xls']:
            result = await self._parse_excel_rab(file_path, project_id)
        elif file_ext == '.pdf':
            result = await self._parse_pdf_rab(file_path, project_id)
        elif file_ext == '.csv':
            result = await self._parse_csv_rab(file_path, project_id)
        else:
            return {
                "error": f"Unsupported file type: {file_ext}",
                "supported_formats": [".xlsx", ".xls", ".pdf", ".csv"]
            }

        # Trigger auto-recalculation if import was successful
        if result.get("status") == "success":
            await self.recalculate_variance(project_id)
            result["variance_updated"] = True

        return result

    async def _parse_excel_rab(
        self,
        file_path: str,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Parse Excel RAB using pandas.
        """
        try:
            # Read Excel
            df = pd.read_excel(file_path)

            # Infer schema mapping
            file_columns = df.columns.tolist()
            sample_data = df.head(3).to_dict('records')

            target_schema = [
                {"name": "item_name", "description": "Item description"},
                {
                    "name": "category",
                    "description": "Category (Material/Labor/Equipment)"
                },
                {"name": "qty_rab", "description": "Planned quantity"},
                {"name": "unit", "description": "Unit of measurement"},
                {
                    "name": "unit_price_rab",
                    "description": "Planned unit price"
                },
            ]

            mapping = await self.ingestion_service.infer_schema_mapping(
                file_columns,
                sample_data,
                target_schema
            )

            # Parse and insert
            budget_lines = []
            for _, row in df.iterrows():
                try:
                    item_name = row.get(mapping.get('item_name', ''))
                    if pd.isna(item_name) or not item_name:
                        continue

                    qty_rab = float(row.get(mapping.get('qty_rab', ''), 0))
                    unit_price_rab = float(
                        row.get(mapping.get('unit_price_rab', ''), 0)
                    )

                    budget_line = BudgetLine(
                        project_id=project_id,
                        item_name=str(item_name),
                        category=str(
                            row.get(mapping.get('category', ''), 'Other')
                        ),
                        qty_rab=qty_rab,
                        unit=str(row.get(mapping.get('unit', ''), 'unit')),
                        unit_price_rab=unit_price_rab,
                        total_price_rab=qty_rab * unit_price_rab,
                        qty_actual=0.0,
                        avg_unit_price_actual=0.0,
                        markup_percentage=0.0,
                        volume_discrepancy=0.0,
                        requires_justification=False
                    )

                    self.db.add(budget_line)
                    budget_lines.append(budget_line)
                except Exception as e:
                    print(f"Error parsing row: {e}")
                    continue

            self.db.commit()

            return {
                "status": "success",
                "lines_imported": len(budget_lines),
                "parsing_summary": {
                    "columns_detected": file_columns,
                    "schema_mapping": mapping,
                    "schema_confidence": 0.9
                }
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    async def _parse_pdf_rab(
        self,
        file_path: str,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Parse PDF RAB using Vision AI (placeholder).
        """
        # In production, this would use VisionService to extract tables
        return {
            "status": "not_implemented",
            "message": "PDF parsing requires Gemini Vision integration",
            "recommendation": "Convert PDF to Excel for immediate upload"
        }

    async def _parse_csv_rab(
        self,
        file_path: str,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Parse the detailed CCO CSV format.
        Schema: item_code, description, unit, qty_contract, ...
        """
        try:
            df = pd.read_csv(file_path)
            budget_lines = []
            for _, row in df.iterrows():
                try:
                    item_code = str(row.get('item_code', ''))
                    if not item_code or item_code == 'nan':
                        continue

                    # Determine category based on item code or name
                    category = "Construction"
                    desc = str(row.get('description', '')).upper()
                    if any(k in desc for k in ["SEMEN", "BESI", "BATU"]):
                        category = "Material"
                    elif any(k in desc for k in ["UPAH", "TENAGA"]):
                        category = "Labor"
                    elif any(k in desc for k in ["ALAT", "SEWA"]):
                        category = "Equipment"

                    budget_line = BudgetLine(
                        project_id=project_id,
                        item_code=item_code,
                        item_name=str(row.get('description', 'Unknown Item')),
                        category=category,
                        unit=str(row.get('unit', 'unit')),
                        qty_rab=float(row.get('qty_contract', 0)),
                        unit_price_rab=float(
                            row.get('unit_price_contract', 0)
                        ),
                        total_price_rab=float(row.get('total_contract', 0)),
                        qty_cco=float(row.get('qty_cco', 0)),
                        unit_price_cco=float(row.get('unit_price_cco', 0)),
                        total_price_cco=float(row.get('total_cco', 0)),
                        qty_actual=0.0,
                        avg_unit_price_actual=0.0,
                        total_spend_actual=0.0,
                        markup_percentage=0.0,
                        volume_discrepancy=0.0,
                        requires_justification=False
                    )
                    self.db.add(budget_line)
                    budget_lines.append(budget_line)
                except Exception as e:
                    print(f"Error parsing CSV row: {e}")
                    continue

            self.db.commit()

            return {
                "status": "success",
                "lines_imported": len(budget_lines),
                "total_value_cco": sum(
                    bl.total_price_cco for bl in budget_lines
                ),
                "total_value_original": sum(
                    bl.total_price_rab for bl in budget_lines
                )
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def get_project_rab(
        self,
        project_id: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all budget lines for a project.
        """
        query = select(BudgetLine).where(BudgetLine.project_id == project_id)

        if category:
            query = query.where(BudgetLine.category == category)

        budget_lines = self.db.exec(query).all()

        return [
            {
                "id": bl.id,
                "item_name": bl.item_name,
                "category": bl.category,
                "qty_rab": bl.qty_rab,
                "unit": bl.unit,
                "unit_price_rab": bl.unit_price_rab,
                "total_price_rab": bl.total_price_rab,
                "qty_actual": bl.qty_actual,
                "avg_unit_price_actual": bl.avg_unit_price_actual,
                "markup_percentage": bl.markup_percentage,
                "volume_discrepancy": bl.volume_discrepancy,
                "requires_justification": bl.requires_justification
            }
            for bl in budget_lines
        ]

    async def recalculate_variance(
        self,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Recalculate variance comparing actuals against Revised (CCO) budget.
        """
        budget_lines = self.db.exec(
            select(BudgetLine).where(BudgetLine.project_id == project_id)
        ).all()

        updated_count = 0

        for bl in budget_lines:
            # Find related transactions by item_code (preferred) or name
            query = select(Transaction).where(
                Transaction.project_id == project_id
            )
            if bl.item_code:
                # Assuming item_code might be in metadata or description
                query = query.where(
                    (Transaction.description.contains(bl.item_code)) |
                    (Transaction.description.contains(bl.item_name))
                )
            else:
                query = query.where(
                    Transaction.description.contains(bl.item_name)
                )

            related_txs = self.db.exec(query).all()

            if related_txs:
                total_qty = sum(tx.quantity or 0 for tx in related_txs)
                total_amount = sum(tx.actual_amount for tx in related_txs)

                bl.qty_actual = total_qty
                bl.avg_unit_price_actual = (
                    total_amount / total_qty if total_qty > 0 else 0
                )
                bl.total_spend_actual = total_amount

                # Priority: CCO Price, Fallback: RAB Price
                baseline_price = (
                    bl.unit_price_cco if bl.unit_price_cco > 0
                    else bl.unit_price_rab
                )
                baseline_qty = (
                    bl.qty_cco if bl.qty_cco > 0
                    else bl.qty_rab
                )

                # Calculate markup vs Baseline
                if baseline_price > 0:
                    bl.markup_percentage = (
                        (bl.avg_unit_price_actual - baseline_price) /
                        baseline_price
                    ) * 100

                # Calculate volume discrepancy vs Baseline
                bl.volume_discrepancy = bl.qty_actual - baseline_qty

                # Flag if requires justification (>10% price or >15% volume)
                vol_threshold = baseline_qty * 0.15
                if (abs(bl.markup_percentage) > 10 or
                        abs(bl.volume_discrepancy) > vol_threshold):
                    bl.requires_justification = True

                self.db.add(bl)
                updated_count += 1

                # Tag matched transactions as 'MAT' if budget is material
                if bl.category.upper() == "MATERIAL":
                    for tx in related_txs:
                        if tx.category_code != "MAT":
                            tx.category_code = "MAT"
                            self.db.add(tx)

        self.db.commit()

        # V4 Auto-Scan for Asset Risks
        await self._scan_and_flag_missing_assets(project_id)

        return {
            "status": "success",
            "updated_count": updated_count,
            "total_lines": len(budget_lines)
        }

    async def _scan_and_flag_missing_assets(self, project_id: str):
        """
        Internal: Checks for missing CAPEX assets and raises AuditLog flags.
        """
        asset_report = self.calculate_non_perishable_assets(project_id)
        
        for asset in asset_report.get("assets", []):
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
        
        self.db.commit()

    async def get_variance_analysis(
        self,
        project_id: str,
        overrides: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive variance analysis comparing Actual vs CCO.
        """
        budget_lines = self.db.exec(
            select(BudgetLine).where(BudgetLine.project_id == project_id)
        ).all()

        if not budget_lines:
            return {"error": "No budget lines found for project"}

        # Totals
        total_original = sum(bl.total_price_rab for bl in budget_lines)
        total_cco = sum(bl.total_price_cco for bl in budget_lines)
        total_actual = sum(bl.total_spend_actual for bl in budget_lines)

        # Variance vs CCO (The current legal budget)
        total_variance = total_actual - total_cco
        variance_ratio = (total_variance / total_cco) if total_cco > 0 else 0
        variance_pct = variance_ratio * 100

        severity = "LOW"
        abs_v = abs(variance_pct)
        if abs_v > 15:
            severity = "CRITICAL"
        elif abs_v > 10:
            severity = "HIGH"
        elif abs_v > 5:
            severity = "MEDIUM"
        return {
            "project_id": project_id,
            "summary": {
                "original_contract_total": total_original,
                "cco_revised_total": total_cco,
                "actual_spend_total": total_actual,
                "variance_idr": total_variance,
                "variance_pct": variance_pct,
                "severity": severity
            },
            "flagged_items": [
                {
                    "item_code": bl.item_code,
                    "item_name": bl.item_name,
                    "markup_pct": bl.markup_percentage,
                    "volume_diff": bl.volume_discrepancy,
                    "actual_total": bl.total_spend_actual,
                    "cco_total": bl.total_price_cco
                }
                for bl in budget_lines if bl.requires_justification
            ],
            "top_savings": sorted(
                [
                    bl for bl in budget_lines
                    if bl.total_spend_actual < bl.total_price_cco
                ],
                key=lambda x: x.total_price_cco - x.total_spend_actual,
                reverse=True
            )[:5],
            "material_forensics": self._calculate_global_material_integrity(
                project_id,
                overrides
            )
        }

    def calculate_non_perishable_assets(self, project_id: str) -> Dict[str, Any]:
        """
        Identifies and summarizes non-perishable assets from budget lines.
        """
        budget_lines = self.db.exec(
            select(BudgetLine).where(BudgetLine.project_id == project_id)
        ).all()

        print(f"DEBUG V1: Found {len(budget_lines)} BLs for project {project_id}")
        # Non-perishable categories/keywords (CAPEX vs OPEX)
        non_perishable_categories = ["EQUIPMENT", "TOOLS", "FURNITURE", "ASSET"]
        asset_keywords = ["GENSET", "EXCAVATOR", "TRUCK", "COMPACTOR", "CONTAINER"]

        assets = []
        total_value = 0.0

        for bl in budget_lines:
            cat = (bl.category or "").upper()
            name = (bl.item_name or "").upper()
            print(f"DEBUG V1: Testing BL {name}, cat={cat}")

            is_asset = (
                cat in non_perishable_categories or
                any(kw in name for kw in asset_keywords)
            )
            print(f"DEBUG V1: is_asset={is_asset}")

            if is_asset:
                asset_val = bl.total_spend_actual if bl.qty_actual > 0 else bl.total_price_rab
                assets.append({
                    "id": bl.id,
                    "item_name": bl.item_name,
                    "category": bl.category,
                    "purchased_qty": bl.qty_actual,
                    "unit": bl.unit,
                    "total_value": asset_val,
                    "status": "LOCATED" if bl.qty_actual > 0 else "MISSING"
                })
                total_value += asset_val

        return {
            "project_id": project_id,
            "total_asset_value": total_value,
            "assets": assets,
            "count": len(assets)
        }

    def _calculate_global_material_integrity(
        self,
        project_id: str,
        overrides: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        v4.0 Feature: Global Material Fund (GMF) Synthesis.
        # Calculates theoretical material volumes and costs vs actual ledger
        # spend.
        """
        # Merge overrides into matrix
        matrix = self._MATERIAL_INTENSITY_MATRIX.copy()
        if overrides:
            for m_key, m_vals in overrides.items():
                if m_key in matrix:
                    matrix[m_key].update(m_vals)
                else:
                    matrix[m_key] = m_vals

        budget_lines = self.db.exec(
            select(BudgetLine).where(BudgetLine.project_id == project_id)
        ).all()

        if not budget_lines:
            return {
                "status": "NO_DATA",
                "message": "No budget data for synthesis"
            }

        theoretical_material_fund = 0.0
        theo_cement_kg = 0.0
        theo_steel_kg = 0.0
        theo_sand_kg = 0.0
        theo_stone_kg = 0.0

        for bl in budget_lines:
            name_upper = bl.item_name.upper()
            intensity = matrix.get("DEFAULT")
            if intensity is None:
                intensity = self._MATERIAL_INTENSITY_MATRIX["DEFAULT"]

            for key, val in matrix.items():
                if key in name_upper:
                    intensity = val
                    break

            baseline_total = (
                bl.total_price_cco if bl.total_price_cco > 0
                else bl.total_price_rab
            )
            baseline_qty = (
                bl.qty_cco if bl.qty_cco > 0
                else bl.qty_rab
            )

            if intensity is None:
                intensity = self._MATERIAL_INTENSITY_MATRIX["DEFAULT"]

            theoretical_material_fund += (
                baseline_total * intensity["material_ratio"]
            )

            # Specific Material Volume Estimation
            if "cement_kg_m3" in intensity:
                theo_cement_kg += baseline_qty * intensity["cement_kg_m3"]
            if "steel_kg_m3" in intensity:
                theo_steel_kg += baseline_qty * intensity["steel_kg_m3"]
            if "sand_kg_m3" in intensity:
                theo_sand_kg += baseline_qty * intensity["sand_kg_m3"]
            if "stone_kg_m3" in intensity:
                theo_stone_kg += baseline_qty * intensity["stone_kg_m3"]

            if "BESI" in name_upper or "STEEL" in name_upper:
                if "KG" in bl.unit.upper():
                    theo_steel_kg += baseline_qty
                elif "TON" in bl.unit.upper():
                    theo_steel_kg += baseline_qty * 1000

        # Ledger Aggregation
        material_txs = self.db.exec(
            select(Transaction).where(
                (Transaction.project_id == project_id) &
                (Transaction.category_code == "MAT")
            )
        ).all()

        actual_material_fund = sum(tx.actual_amount for tx in material_txs)

        # Helper to search by keywords
        def get_actual_qty(keywords: List[str]):
            return sum(
                tx.quantity for tx in material_txs
                if any(
                    k in tx.description.upper()
                    for k in keywords
                )
            )

        actual_cement_kg = get_actual_qty(["SEMEN", "CEMENT"])
        actual_steel_kg = get_actual_qty(["BESI", "STEEL", "REBAR"])
        actual_sand_kg = get_actual_qty(["PASIR", "SAND"])
        actual_stone_kg = get_actual_qty(["BATU", "STONE", "KERIKIL", "SPLIT"])

        fund_gap = theoretical_material_fund - actual_material_fund
        fund_gap_pct = (fund_gap / theoretical_material_fund * 100) \
            if theoretical_material_fund > 0 else 0

        status = "VERIFIED"
        if fund_gap_pct > 25:
            status = "CRITICAL_GHOST_SPEND"
        elif fund_gap_pct > 15:
            status = "MODERATE_ANOMALY"

        cement_gap = (1 - (actual_cement_kg / theo_cement_kg)) * 100 \
            if theo_cement_kg > 0 else 0
        steel_gap = (1 - (actual_steel_kg / theo_steel_kg)) * 100 \
            if theo_steel_kg > 0 else 0
        sand_gap = (1 - (actual_sand_kg / theo_sand_kg)) * 100 \
            if theo_sand_kg > 0 else 0
        stone_gap = (1 - (actual_stone_kg / theo_stone_kg)) * 100 \
            if theo_stone_kg > 0 else 0

        return {
            "theoretical_material_fund": theoretical_material_fund,
            "actual_material_fund": actual_material_fund,
            "gap_percentage": fund_gap_pct,
            "status": status,
            "specific_check": {
                "cement": {
                    "theoretical_kg": theo_cement_kg,
                    "actual_kg": actual_cement_kg,
                    "gap_pct": cement_gap
                },
                "steel": {
                    "theoretical_kg": theo_steel_kg,
                    "actual_kg": actual_steel_kg,
                    "gap_pct": steel_gap
                },
                "sand": {
                    "theoretical_kg": theo_sand_kg,
                    "actual_kg": actual_sand_kg,
                    "gap_pct": sand_gap
                },
                "stone": {
                    "theoretical_kg": theo_stone_kg,
                    "actual_kg": actual_stone_kg,
                    "gap_pct": stone_gap
                }
            },
            "analysis": (
                f"Project required IDR {theoretical_material_fund:,.0f} "
                f"in materials. Ledger shows IDR {actual_material_fund:,.0f}."
            )
        }
