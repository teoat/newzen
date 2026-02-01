
import math
from typing import List, Dict, Any, Set, Tuple
from sqlmodel import Session, select, or_
from app.models import Transaction, Entity


class NetworkService:
    def __init__(self, db: Session):
        self.db = db

    def get_neighborhood(self, root_entity_id: str, depth: int = 2) -> Dict[str, Any]:
        """
        Builds a graph of transactions surrounding a central entity.
        Returns nodes and links with pre-calculated positions (circular layout).
        """
        nodes: Dict[str, Dict[str, Any]] = {}
        links: List[Dict[str, Any]] = []
        visited: Set[str] = set()
        queue: List[Tuple[str, int]] = [(root_entity_id, 0)]

        # Mapping for layout
        levels: Dict[int, List[str]] = {0: [], 1: [], 2: [], 3: []}

        # 1. Fetch Root Entity
        root_entity = self.db.exec(
            select(Entity).where(Entity.id == root_entity_id)
        ).first()

        # Initialize Root Node
        if root_entity:
            nodes[root_entity_id] = {
                "id": root_entity_id,
                "label": root_entity.name,
                "type": root_entity.type,
                "risk": root_entity.risk_score,
                "level": 0
            }
            levels[0].append(root_entity_id)
            visited.add(root_entity_id)

        # 2. BFS Traversal
        while queue:
            current_id, current_depth = queue.pop(0)
            if current_depth >= depth:
                continue

            # Find transactions where current_id is sender OR receiver
            # Note: This relies on sender_entity_id/receiver_entity_id
            # Fallback to name matching logic would be needed for raw strings,
            # but for v2 we assume entity resolution ran.

            txs = self.db.exec(
                select(Transaction).where(
                    or_(
                        Transaction.sender_entity_id == current_id,
                        Transaction.receiver_entity_id == current_id
                    )
                ).limit(50)  # Safety limit
            ).all()

            for tx in txs:
                # Identify the "other" side
                is_sender = tx.sender_entity_id == current_id
                other_id = (
                    tx.receiver_entity_id if is_sender
                    else tx.sender_entity_id
                )

                if not other_id:
                    # If entity ID is missing, we skip
                    continue

                # Add Link
                # Check duplication? Simple append for now
                links.append({
                    "source": tx.sender_entity_id,
                    "target": tx.receiver_entity_id,
                    "value": tx.amount,
                    "type": "Transaction"
                })

                # Process Neighbor Node
                if other_id not in visited:
                    visited.add(other_id)
                    other_entity = self.db.exec(
                        select(Entity).where(Entity.id == other_id)
                    ).first()
                    if other_entity:
                        nodes[other_id] = {
                            "id": other_id,
                            "label": other_entity.name,
                            "type": other_entity.type,
                            "risk": other_entity.risk_score,
                            "level": current_depth + 1
                        }
                        levels.setdefault(current_depth + 1, []).append(other_id)
                        queue.append((other_id, current_depth + 1))

        # 3. Compute Layout (Circular Concentric)
        final_nodes = []
        center_x, center_y = 50, 50

        for level, node_ids in levels.items():
            if not node_ids:
                continue

            if level == 0:
                # Root at center
                n = nodes[node_ids[0]]
                n['x'] = center_x
                n['y'] = center_y
                final_nodes.append(n)
            else:
                # Orbit
                radius = 25 * level  # 25% for level 1, 50% for level 2
                count = len(node_ids)
                angle_step = (2 * math.pi) / count if count > 0 else 0

                for i, nid in enumerate(node_ids):
                    angle = i * angle_step
                    # Convert polar to cartesian (percentage based 0-100)
                    n = nodes[nid]
                    n['x'] = center_x + (radius * math.cos(angle))
                    n['y'] = center_y + (radius * math.sin(angle))

                    # Bound check (keep inside 0-100 box loosely)
                    n['x'] = max(5, min(95, n['x']))
                    n['y'] = max(5, min(95, n['y']))

                    final_nodes.append(n)

        return {
            "entity_id": root_entity_id,
            "depth": depth,
            "nodes": final_nodes,
            "links": links
        }
    
    def build_networkx_graph(self, project_id: str) -> Any:
        """
        Build NetworkX graph for advanced analytics.
        Returns nx.DiGraph object.
        """
        try:
            import networkx as nx
        except ImportError:
            return None
        
        # Fetch all transactions for project
        txs = self.db.exec(
            select(Transaction).where(Transaction.project_id == project_id)
        ).all()
        
        G = nx.DiGraph()
        
        for tx in txs:
            if tx.sender_entity_id and tx.receiver_entity_id:
                if G.has_edge(tx.sender_entity_id, tx.receiver_entity_id):
                    G[tx.sender_entity_id][tx.receiver_entity_id]["weight"] += tx.amount
                    G[tx.sender_entity_id][tx.receiver_entity_id]["count"] += 1
                else:
                    G.add_edge(
                        tx.sender_entity_id,
                        tx.receiver_entity_id,
                        weight=tx.amount,
                        count=1,
                        risk_score=tx.risk_score or 0.0
                    )
        
        return G
    
    def find_shortest_path(
        self,
        project_id: str,
        source_id: str,
        target_id: str
    ) -> Dict[str, Any]:
        """Find shortest path between two entities."""
        try:
            import networkx as nx
            
            G = self.build_networkx_graph(project_id)
            if not G:
                return {"error": "NetworkX not available"}
            
            try:
                path = nx.shortest_path(G, source=source_id, target=target_id, weight="weight")
                length = nx.shortest_path_length(G, source=source_id, target=target_id, weight="weight")
                
                return {
                    "path": path,
                    "length": len(path) - 1,
                    "total_weight": length,
                    "exists": True
                }
            except nx.NetworkXNoPath:
                return {
                    "path": [],
                    "length": 0,
                    "total_weight": 0,
                    "exists": False,
                    "message": "No path exists"
                }
        except Exception as e:
            return {"error": str(e)}
    
    def detect_communities(self, project_id: str) -> List[List[str]]:
        """Detect communities in transaction network."""
        try:
            import networkx as nx
            
            G = self.build_networkx_graph(project_id)
            if not G:
                return []
            
            # Use strongly connected components as communities
            components = list(nx.strongly_connected_components(G))
            return [list(comp) for comp in components if len(comp) > 1]
        except Exception:
            return []
    
    def identify_key_players(self, project_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Identify most influential entities."""
        try:
            import networkx as nx
            
            G = self.build_networkx_graph(project_id)
            if not G:
                return []
            
            pagerank = nx.pagerank(G)
            betweenness = nx.betweenness_centrality(G)
            
            key_players = []
            for node_id in G.nodes():
                key_players.append({
                    "entity_id": node_id,
                    "pagerank": pagerank.get(node_id, 0),
                    "betweenness": betweenness.get(node_id, 0),
                    "degree": G.degree(node_id),
                    "influence_score": pagerank.get(node_id, 0) * 0.6 + betweenness.get(node_id, 0) * 0.4
                })
            
            key_players.sort(key=lambda x: x["influence_score"], reverse=True)
            return key_players[:top_n]
        except Exception:
            return []
    
    def detect_circular_flows(self, project_id: str, max_hops: int = 4) -> List[Dict[str, Any]]:
        """
        Advanced Multi-Hop Circular Flow Detection.
        Detects loops like A -> B -> C -> A that signify money washing.
        """
        try:
            import networkx as nx
            
            G = self.build_networkx_graph(project_id)
            if not G:
                return []
            
            # Use simple_cycles which finds all elementary circuits
            # Note: For large graphs, this can be expensive. 
            # We use it because project graphs are typically manageable (<500 entities)
            all_cycles = list(nx.simple_cycles(G))
            
            significant_cycles = []
            for cycle in all_cycles:
                if 2 <= len(cycle) <= max_hops:
                    # Calculate cycle stats
                    total_volume = 0
                    risk_sum = 0
                    cycle_links = []
                    
                    for i in range(len(cycle)):
                        u = cycle[i]
                        v = cycle[(i + 1) % len(cycle)]
                        edge_data = G[u][v]
                        total_volume += edge_data["weight"]
                        risk_sum += edge_data.get("risk_score", 0)
                        cycle_links.append({"from": u, "to": v, "val": edge_data["weight"]})
                    
                    significant_cycles.append({
                        "hops": len(cycle),
                        "entities": cycle,
                        "links": cycle_links,
                        "total_volume": total_volume,
                        "avg_risk": risk_sum / len(cycle),
                        "description": f"Circular flow of {total_volume:,.0f} IDR across {len(cycle)} entities."
                    })
            
            # Sort by risk and volume
            significant_cycles.sort(key=lambda x: (x["avg_risk"], x["total_volume"]), reverse=True)
            return significant_cycles[:50]
        except Exception as e:
            print(f"Circular Flow Error: {e}")
            return []
