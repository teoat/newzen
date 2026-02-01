"""
Flow Tracer Service
Provides Sankey-based transaction flow analysis and circular pattern detection
"""

import networkx as nx
from typing import Dict, Any
from sqlmodel import Session, select
from app.models import Transaction
import logging

logger = logging.getLogger(__name__)

class FlowTracerService:
    def __init__(self, db: Session):
        self.db = db

    def trace_payment_flow(self, project_id: str, min_amount: float = 0) -> Dict[str, Any]:
        """
        Builds a Sankey-compatible flow structure from real transactions.
        Detects circular patterns using graph theory.
        """
        import sqlalchemy as sa
        query = select(Transaction).where(Transaction.project_id == project_id)
        if min_amount > 0:
            query = query.where(
                sa.case(
                    (Transaction.actual_amount > 0, Transaction.actual_amount),
                    (Transaction.proposed_amount > 0, Transaction.proposed_amount),
                    else_=Transaction.amount
                ) >= min_amount
            )
            
        transactions = self.db.exec(query).all()
        
        # Prepare Sankey structure
        nodes_set = set()
        flows = []
        
        for tx in transactions:
            if tx.sender and tx.receiver:
                nodes_set.add(tx.sender)
                nodes_set.add(tx.receiver)
                flows.append({
                    "source": tx.sender,
                    "target": tx.receiver,
                    "value": float(tx.verified_amount),
                    "date": tx.transaction_date.isoformat() if tx.transaction_date else None,
                    "is_suspicious": (tx.risk_score or 0) > 0.7,
                    "id": tx.id
                })
        
        # Detect Cycles
        G = nx.DiGraph()
        for f in flows:
            G.add_edge(f["source"], f["target"], weight=f["value"])
            
        cycles = []
        try:
            # simple_cycles finds all elementary circuits in a directed graph
            raw_cycles = list(nx.simple_cycles(G))
            # Sort by length and take top significant ones
            raw_cycles.sort(key=len, reverse=True)
            cycles = [c for c in raw_cycles if len(c) >= 2][:20]
        except Exception:
            logger.error("Failed to detect cycles in flow")
            
        return {
            "flows": flows,
            "nodes": [{"id": node, "label": node} for node in nodes_set],
            "circular_patterns": cycles,
            "metrics": {
                "total_flows": len(flows),
                "total_volume": sum(f["value"] for f in flows),
                "high_risk_flows": len([f for f in flows if f["is_suspicious"]]),
                "detect_cycles": len(cycles)
            }
        }

    def find_multi_hop_path(self, project_id: str, source_id: str, target_id: str) -> Dict[str, Any]:
        """Traces flows across multiple hops between two entities."""
        G = nx.DiGraph()
        query = select(Transaction).where(Transaction.project_id == project_id)
        transactions = self.db.exec(query).all()
        
        for tx in transactions:
            if tx.sender and tx.receiver:
                G.add_edge(tx.sender, tx.receiver, weight=float(tx.verified_amount))
                
        try:
            path = nx.shortest_path(G, source=source_id, target=target_id, weight="weight")
            return {
                "exists": True,
                "path": path,
                "hops": len(path) - 1
            }
        except nx.NetworkXNoPath:
            return {"exists": False, "path": [], "hops": 0}
        except Exception as e:
            return {"error": str(e), "exists": False}
