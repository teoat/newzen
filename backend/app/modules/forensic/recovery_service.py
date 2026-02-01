from typing import Dict, Any
from sqlmodel import Session, select
from app.models import Transaction


class AssetRecoveryService:
    @staticmethod
    def trace_asset(project_id: str) -> Dict[str, Any]:
        """
        Stub for asset tracing.
        """
        return {
            "project_id": project_id,
            "status": "TRACED",
            "assets_identified": [],
            "risk_score": 0.0,
            "message": "Asset tracing completed. No immediate recovery targets identified."
        }

    @staticmethod
    def trace_project_budget(db: Session, project_id: str) -> Dict[str, Any]:
        """
        Generates a Flow Graph (Sankey-ready) of the project budget.
        """
        # 1. Fetch Project Transactions
        txs = db.exec(
            select(Transaction).where(Transaction.project_id == project_id)
        ).all()
        
        nodes_dict = {}
        links = []
        
        # Helper to get/create node
        def get_node(name, group="ENTITY"):
            if name not in nodes_dict:
                nodes_dict[name] = {"id": name, "label": name, "type": group, "value": 0}
            return name

        # 2. Build Graph Logic (Reconciliation View)
        project_root = get_node(f"PROJ-{project_id}", "PROJECT_ROOT")
        
        for t in txs:
            # Source: Project -> Category Allocation
            cat_label = t.category_code.value if hasattr(t.category_code, 'value') else str(t.category_code)
            cat_node = get_node(cat_label, "CATEGORY")
            
            # Target: Category -> Entity/Vendor
            vendor_node = get_node(t.receiver or "Unknown Vendor", "VENDOR")
            
            # Link 1: Project -> Category
            links.append({
                "source": project_root, 
                "target": cat_node, 
                "value": t.actual_amount,
                "currency": t.currency
            })
            
            # Link 2: Category -> Vendor
            links.append({
                "source": cat_node,
                "target": vendor_node,
                "value": t.actual_amount,
                "currency": t.currency
            })
            
            # Accumulate value
            nodes_dict[vendor_node]["value"] += t.actual_amount
            
        # Convert dictionary to list
        nodes = list(nodes_dict.values())
        
        return {
            "project_id": project_id,
            "graph_type": "RECONCILIATION_FLOW",
            "node_count": len(nodes),
            "link_count": len(links),
            "graph": {"nodes": nodes, "links": links},
            "reconciliation_note": "Visualizes flow from Budget Allocation -> Cost Category -> Final Vendor"
        }

