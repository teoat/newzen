from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import Any, Dict
from datetime import datetime
from app.core.db import get_session
from app.models import Transaction, Project
from app.core.auth_middleware import verify_project_access

router = APIRouter(prefix="/forensic/{project_id}/nexus", tags=["Nexus Graph"])


@router.get("/", response_model=Dict[str, Any])
async def get_nexus_graph(
    project_id: str,
    project: Project = Depends(verify_project_access),
    db: Session = Depends(get_session),
):
    """
    Generates the Nexus Relationship Graph from Real Forensic Data.
    Scoped to validated project.
    Nodes: Projects, Companies (Entities), Individuals.
    Links: Financial Flows (Transactions) & Potential Relationships.
    """
    # Fetch Data with Filter
    query_projects = select(Project).where(Project.id == project.id)
    query_txs = select(Transaction).where(Transaction.project_id == project.id)

    projects = db.exec(query_projects).all()
    transactions = db.exec(query_txs).all()
    nodes_dict = {}
    links_list = []

    # Helper to clean names
    def clean_name(name: str) -> str:
        return name.strip().upper()

    # Helper to guess type
    def guess_type(name: str) -> str:
        n = name.upper()
        if any(x in n for x in ["PT", "CV", "UD", "YAYASAN", "KOPERASI", "CORP", "INC", "LTD"]):
            return "company"
        return "person"

    # 1. Project Nodes (Root Nodes)
    for p in projects:
        p_node_id = f"proj_{p.id}"
        nodes_dict[p_node_id] = {
            "id": p_node_id,
            "label": p.name,
            "type": "project",
            "risk": 0.0,
            "val": 25,
        }
    # 2. Map Transactions to Network
    flow_map = {}  # (source_id, target_id) -> data
    for t in transactions:
        src_label = clean_name(t.sender or "Unknown")
        tgt_label = clean_name(t.receiver or "Unknown")
        p_node_id = f"proj_{t.project_id}"
        # Discover and Add Nodes
        src_id = f"ent_{src_label.replace(' ', '_')}"
        tgt_id = f"ent_{tgt_label.replace(' ', '_')}"
        for e_id, e_label in [(src_id, src_label), (tgt_id, tgt_label)]:
            if e_id not in nodes_dict:
                nodes_dict[e_id] = {
                    "id": e_id,
                    "label": e_label,
                    "type": guess_type(e_label),
                    "risk": 0.1,
                    "val": 10,
                }
        # 1. External Flow Link: Sender -> Recipient
        if t.sender and t.receiver:
            key = (src_id, tgt_id)
            if key not in flow_map:
                flow_map[key] = {"val": 0, "type": "Payment"}
            flow_map[key]["val"] += t.actual_amount
        # 2. Disbursement Link: Project -> Recipient
        if p_node_id in nodes_dict and t.receiver:
            key = (p_node_id, tgt_id)
            if key not in flow_map:
                flow_map[key] = {"val": 0, "type": "Disbursement"}
            flow_map[key]["val"] += t.actual_amount
    # Convert Flow Map to Links
    for (s_id, target_id), data in flow_map.items():
        links_list.append(
            {
                "source": s_id,
                "target": target_id,
                "value": data["val"],
                "type": data["type"],
            }
        )
    # 3. Family / Relationship Detection (Surnames)
    surnames = {}
    for node_id, node in nodes_dict.items():
        if node["type"] == "person":
            parts = node["label"].split()
            if len(parts) > 1:
                last_name = parts[-1]
                if len(last_name) > 3:
                    if last_name not in surnames:
                        surnames[last_name] = []
                    surnames[last_name].append(node_id)
    for name, ids in surnames.items():
        if len(ids) > 1:
            for i in range(len(ids)):
                for j in range(i + 1, len(ids)):
                    links_list.append(
                        {
                            "source": ids[i],
                            "target": ids[j],
                            "value": 1,
                            "risk": 0.3,
                            "type": "Affinity Connection",
                        }
                    )
    # 4. Risk Propagation Logic
    for _ in range(2):
        for path_link in [li for li in links_list if li["type"] != "Affinity Connection"]:
            src = nodes_dict.get(path_link["source"])
            tgt = nodes_dict.get(path_link["target"])
            if src and tgt and src["risk"] > 0.6:
                tgt["risk"] = min(0.95, tgt["risk"] + 0.1)
    return {
        "nodes": list(nodes_dict.values()),
        "links": links_list,
        "meta": {
            "project_id": project.id,
            "generated_at": datetime.now().isoformat(),
            "entity_count": len(nodes_dict),
            "relations_detected": len(links_list),
        },
    }
