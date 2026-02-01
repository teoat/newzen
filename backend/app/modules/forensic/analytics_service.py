"""
Analytics Service for real-time ledger aggregation.
Provides SQL-based analytics for dashboard metrics.
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlmodel import Session, select, func
import sqlalchemy as sa
from app.models import (
    Transaction, BudgetLine, Milestone,
    Project, Entity
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_project_dashboard(
        self,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Generate comprehensive project analytics.
        
        Returns financial metrics, leakage estimates, and variance data.
        """
        # Fetch project
        project = self.db.exec(
            select(Project).where(Project.id == project_id)
        ).first()
        
        if not project:
            return {"error": "Project not found"}

        # Calculate financial metrics
        total_released = self.db.exec(
            select(func.sum(Milestone.released_amount))
            .where(Milestone.project_id == project_id)
        ).first() or 0.0

        total_spent = self.db.exec(
            select(func.sum(Transaction.actual_amount))
            .where(Transaction.project_id == project_id)
            .where(Transaction.verification_status == "VERIFIED")
        ).first() or 0.0

        # Calculate leakage (simplified)
        leakage = total_released - total_spent
        
        # Fetch budget variance
        budget_lines = self.db.exec(
            select(BudgetLine).where(BudgetLine.project_id == project_id)
        ).all()

        variance_data = []
        total_markup_leakage = 0.0
        
        for line in budget_lines:
            if line.markup_percentage > 0:
                markup_value = (
                    line.avg_unit_price_actual - line.unit_price_rab
                ) * line.qty_actual
                total_markup_leakage += markup_value
                
            variance_data.append({
                "item_name": line.item_name,
                "category": line.category,
                "unit_price_rab": line.unit_price_rab,
                "avg_unit_price_actual": line.avg_unit_price_actual,
                "markup_percentage": line.markup_percentage,
                "volume_discrepancy": line.volume_discrepancy,
                "rab_quantity": line.qty_rab,
                "actual_quantity": line.qty_actual,
                "unit": line.unit
            })

        return {
            "project": {
                "name": project.name,
                "code": project.code,
                "status": project.status
            },
            "financials": {
                "contract_value": project.contract_value,
                "total_released": float(total_released),
                "total_spent_onsite": float(total_spent)
            },
            "leakage": {
                "total_leakage": float(leakage),
                "markup_leakage": float(total_markup_leakage)
            },
            "budget_variance": variance_data
        }

    def get_s_curve_data(
        self,
        project_id: str
    ) -> Dict[str, Any]:
        """
        Generate S-Curve data comparing planned vs actual spend.
        """
        # Get all transactions for the project
        transactions = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .order_by(Transaction.transaction_date)
        ).all()

        # Get budget lines
        budget_lines = self.db.exec(
            select(BudgetLine).where(BudgetLine.project_id == project_id)
        ).all()
        
        total_budget = sum(line.total_price_rab for line in budget_lines)
        
        # Aggregate by month
        curve_data = []
        cumulative_actual = 0.0
        
        if transactions:
            # Group by month
            from collections import defaultdict
            monthly_spend = defaultdict(float)
            
            for tx in transactions:
                if tx.transaction_date:
                    month_key = tx.transaction_date.strftime("%Y-%m")
                    monthly_spend[month_key] += tx.actual_amount
            
            # Generate cumulative curve
            for month in sorted(monthly_spend.keys()):
                cumulative_actual += monthly_spend[month]
                month_date = datetime.strptime(month, "%Y-%m")
                
                # Improved planned value calculation
                project_record = self.db.exec(
                    select(Project)
                    .where(Project.id == project_id)
                ).first()
                
                if project_record and project_record.start_date:
                    start = project_record.start_date
                    # Determine end date: use project.end_date, or default to 1 year after start
                    end = project_record.end_date or (start + timedelta(days=365))
                    
                    total_duration_days = max(1, (end - start).days)
                    days_elapsed = (month_date - start).days
                    
                    # Progress percentage based on time
                    planned_pct = max(0, min(100, (days_elapsed / total_duration_days) * 100))
                    planned_value = (planned_pct / 100) * total_budget
                else:
                    planned_value = cumulative_actual
                
                curve_data.append({
                    "date": f"{month}-01",
                    "pv": planned_value,
                    "ac": cumulative_actual
                })
        
        return {"curve_data": curve_data}

    def get_high_risk_transactions(
        self,
        project_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetch transactions flagged with forensic markers.
        """
        transactions = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == project_id)
            .where(
                (Transaction.potential_misappropriation) |
                (Transaction.is_circular) |
                (Transaction.needs_proof) |
                (Transaction.is_redacted)
            )
            .order_by(Transaction.risk_score.desc())
            .limit(limit)
        ).all()

        return [
            {
                "id": tx.id,
                "amount": tx.actual_amount,
                "description": tx.description,
                "timestamp": tx.timestamp.isoformat(),
                "risk_score": tx.risk_score,
                "flags": {
                    "misappropriation": tx.potential_misappropriation,
                    "circular": tx.is_circular,
                    "needs_proof": tx.needs_proof,
                    "redacted": tx.is_redacted
                }
            }
            for tx in transactions
        ]

    def get_entity_risk_profile(
        self,
        entity_id: str
    ) -> Dict[str, Any]:
        """
        Calculate risk metrics for a specific entity.
        """
        entity = self.db.exec(
            select(Entity).where(Entity.id == entity_id)
        ).first()
        
        if not entity:
            return {"error": "Entity not found"}

        # Count transactions
        sent_count = self.db.exec(
            select(func.count(Transaction.id))
            .where(Transaction.sender_entity_id == entity_id)
        ).first() or 0

        received_count = self.db.exec(
            select(func.count(Transaction.id))
            .where(Transaction.receiver_entity_id == entity_id)
        ).first() or 0

        # Calculate total flow
        sent_total = self.db.exec(
            select(func.sum(sa.case((Transaction.actual_amount > 0, Transaction.actual_amount), (Transaction.proposed_amount > 0, Transaction.proposed_amount), else_=Transaction.amount)))
            .where(Transaction.sender_entity_id == entity_id)
        ).first() or 0.0

        received_total = self.db.exec(
            select(func.sum(sa.case((Transaction.actual_amount > 0, Transaction.actual_amount), (Transaction.proposed_amount > 0, Transaction.proposed_amount), else_=Transaction.amount)))
            .where(Transaction.receiver_entity_id == entity_id)
        ).first() or 0.0

        return {
            "entity": {
                "id": entity.id,
                "name": entity.name,
                "type": entity.type,
                "base_risk_score": entity.risk_score
            },
            "transaction_stats": {
                "sent_count": sent_count,
                "received_count": received_count,
                "sent_total": float(sent_total),
                "received_total": float(received_total),
                "net_flow": float(received_total - sent_total)
            }
        }
