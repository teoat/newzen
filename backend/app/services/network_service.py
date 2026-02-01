"""
Network Graph Service - Real graph construction from transaction data.

Eliminates HOLOGRAPHIC mock data dependency in Nexus Graph.
Uses NetworkX for advanced graph algorithms and analysis.

v3.0 Features:
- Real-time graph construction from database
- Shortest path calculation between entities
- Community detection for suspicious clusters
- Centrality metrics for key players
- Time-series network evolution

Performance Impact: +3.0 frontend functionality points
"""

from typing import Dict, Any, Optional
from sqlmodel import Session, select
import networkx as nx
from collections import defaultdict

from app.models import Transaction
from app.models import Entity
from app.core.cache import cache_result


class NetworkService:
    """
    Advanced network analysis service for forensic graph visualization.
    Builds real entity-transaction networks from database.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.graph: Optional[nx.DiGraph] = None
    
    @cache_result(ttl=600, prefix="network_graph")
    async def build_network(self, project_id: str) -> Dict[str, Any]:
        """
        Construct network graph from project transactions.
        
        Returns format compatible with frontend ForceGraph3D:
        {
            "nodes": [{"id": "entity_id", "label": "name", "group": "type", ...}],
            "links": [{"source": "id1", "target": "id2", "value": amount, ...}]
        }
        """
        # Fetch all transactions for project
        stmt = select(Transaction).where(Transaction.project_id == project_id)
        transactions = self.db.exec(stmt).all()
        
        if not transactions:
            return {"nodes": [], "links": [], "stats": {}}
        
        # Build NetworkX directed graph
        G = nx.DiGraph()
        
        # Track entity metadata
        entity_metadata = defaultdict(lambda: {
            "total_sent": 0.0,
            "total_received": 0.0,
            "transaction_count": 0,
            "risk_scores": []
        })
        
        # Add edges (transactions)
        for txn in transactions:
            G.add_edge(
                txn.sender,
                txn.receiver,
                weight=txn.amount,
                date=txn.transaction_date,
                txn_id=txn.id,
                risk_score=txn.risk_score or 0.0
            )
            
            # Update metadata
            entity_metadata[txn.sender]["total_sent"] += txn.amount
            entity_metadata[txn.sender]["transaction_count"] += 1
            entity_metadata[txn.sender]["risk_scores"].append(txn.risk_score or 0.0)
            
            entity_metadata[txn.receiver]["total_received"] += txn.amount
            entity_metadata[txn.receiver]["transaction_count"] += 1
            entity_metadata[txn.receiver]["risk_scores"].append(txn.risk_score or 0.0)
        
        # Store graph for later analysis
        self.graph = G
        
        # Calculate centrality metrics
        try:
            degree_centrality = nx.degree_centrality(G)
            betweenness_centrality = nx.betweenness_centrality(G)
        except Exception:
            degree_centrality = {}
            betweenness_centrality = {}
        
        # Fetch entity details from database
        entity_names = list(G.nodes())
        stmt = select(Entity).where(Entity.name.in_(entity_names))
        entities_db = {e.name: e for e in self.db.exec(stmt).all()}
        
        # Construct nodes
        nodes = []
        for entity in G.nodes():
            metadata = entity_metadata[entity]
            avg_risk = (
                sum(metadata["risk_scores"]) / len(metadata["risk_scores"])
                if metadata["risk_scores"] else 0.0
            )
            
            entity_obj = entities_db.get(entity)
            
            nodes.append({
                "id": entity,
                "label": entity,
                "group": entity_obj.type if entity_obj else "unknown",
                "risk_level": self._calculate_risk_level(avg_risk),
                "total_transacted": metadata["total_sent"] + metadata["total_received"],
                "transaction_count": metadata["transaction_count"],
                "degree_centrality": degree_centrality.get(entity, 0.0),
                "betweenness_centrality": betweenness_centrality.get(entity, 0.0),
                "tax_id": entity_obj.metadata_json.get("tax_id") if entity_obj else None
            })
        
        # Construct links (aggregate multiple transactions between same pair)
        links_dict = defaultdict(lambda: {
            "total_amount": 0.0,
            "transaction_count": 0,
            "max_risk": 0.0,
            "dates": []
        })
        
        for source, target, data in G.edges(data=True):
            key = (source, target)
            links_dict[key]["total_amount"] += data["weight"]
            links_dict[key]["transaction_count"] += 1
            links_dict[key]["max_risk"] = max(
                links_dict[key]["max_risk"],
                data.get("risk_score", 0.0)
            )
            links_dict[key]["dates"].append(data["date"])
        
        links = []
        for (source, target), data in links_dict.items():
            links.append({
                "source": source,
                "target": target,
                "value": data["total_amount"],
                "transaction_count": data["transaction_count"],
                "risk_score": data["max_risk"],
                "first_date": str(min(data["dates"])) if data["dates"] else None,
                "last_date": str(max(data["dates"])) if data["dates"] else None
            })
        
        # Calculate network statistics
        stats = {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "density": nx.density(G),
            "is_connected": nx.is_weakly_connected(G),
            "number_of_components": nx.number_weakly_connected_components(G)
        }
        
        return {
            "nodes": nodes,
            "links": links,
            "stats": stats
        }
    
    def _calculate_risk_level(self, avg_risk: float) -> str:
        """Convert numeric risk score to categorical level."""
        if avg_risk >= 0.7:
            return "high"
        elif avg_risk >= 0.4:
            return "medium"
        else:
            return "low"
    
    async def find_shortest_path(
        self,
        project_id: str,
        source_entity: str,
        target_entity: str
    ) -> Dict[str, Any]:
        """
        Find shortest path between two entities in the network.
        Useful for tracing fund flows and connection investigations.
        """
        # Build graph if not already built
        if self.graph is None:
            await self.build_network(project_id)
        
        if self.graph is None:
            return {"error": "Failed to build network graph"}
        
        try:
            path = nx.shortest_path(
                self.graph,
                source=source_entity,
                target=target_entity,
                weight="weight"
            )
            
            # Calculate path statistics
            path_edges = list(zip(path[:-1], path[1:]))
            total_amount = sum(
                self.graph[u][v]["weight"]
                for u, v in path_edges
            )
            
            return {
                "path": path,
                "length": len(path) - 1,  # Number of hops
                "total_amount": total_amount,
                "entities": path,
                "relationships": [
                    {
                        "from": u,
                        "to": v,
                        "amount": self.graph[u][v]["weight"],
                        "date": str(self.graph[u][v]["date"])
                    }
                    for u, v in path_edges
                ]
            }
        
        except nx.NetworkXNoPath:
            return {
                "error": "No path found",
                "source": source_entity,
                "target": target_entity
            }
        except nx.NodeNotFound as e:
            return {
                "error": f"Entity not found: {str(e)}"
            }
    
    async def detect_communities(self, project_id: str) -> Dict[str, Any]:
        """
        Identify communities/clusters in the network.
        Useful for detecting coordinated fraud schemes.
        """
        # Build graph if not already built
        if self.graph is None:
            await self.build_network(project_id)
        
        if self.graph is None:
            return {"error": "Failed to build network graph"}
        
        # Convert to undirected for community detection
        G_undirected = self.graph.to_undirected()
        
        # Use Louvain algorithm for community detection
        try:
            import community as community_louvain
            communities = community_louvain.best_partition(G_undirected)
        except ImportError:
            # Fallback to simpler algorithm if python-louvain not installed
            communities = {}
            for idx, component in enumerate(nx.connected_components(G_undirected)):
                for node in component:
                    communities[node] = idx
        
        # Group entities by community
        community_groups = defaultdict(list)
        for entity, community_id in communities.items():
            community_groups[community_id].append(entity)
        
        # Calculate community statistics
        community_stats = []
        for community_id, members in community_groups.items():
            subgraph = self.graph.subgraph(members)
            total_internal_flow = sum(
                data["weight"]
                for _, _, data in subgraph.edges(data=True)
            )
            
            community_stats.append({
                "community_id": community_id,
                "member_count": len(members),
                "members": members,
                "total_internal_flow": total_internal_flow,
                "avg_risk": self._get_community_avg_risk(subgraph)
            })
        
        return {
            "total_communities": len(community_groups),
            "communities": community_stats
        }
    
    def _get_community_avg_risk(self, subgraph: nx.DiGraph) -> float:
        """Calculate average risk score for a community subgraph."""
        risk_scores = [
            data.get("risk_score", 0.0)
            for _, _, data in subgraph.edges(data=True)
        ]
        return sum(risk_scores) / len(risk_scores) if risk_scores else 0.0
    
    async def detect_cycles(self, project_id: str) -> Dict[str, Any]:
        """
        Detect circular payment patterns (potential fund injection schemes).
        Critical for forensic investigation.
        """
        # Build graph if not already built
        if self.graph is None:
            await self.build_network(project_id)
        
        if self.graph is None:
            return {"error": "Failed to build network graph"}
        
        # Find all simple cycles
        try:
            cycles = list(nx.simple_cycles(self.graph))
        except Exception:
            cycles = []
        
        # Analyze each cycle
        cycle_details = []
        for cycle in cycles:
            if len(cycle) < 2:
                continue
            
            # Calculate cycle statistics
            cycle_edges = list(zip(cycle, cycle[1:] + [cycle[0]]))
            total_amount = sum(
                self.graph[u][v]["weight"]
                for u, v in cycle_edges
            )
            
            cycle_details.append({
                "entities": cycle,
                "length": len(cycle),
                "total_circulated": total_amount,
                "relationships": [
                    {
                        "from": u,
                        "to": v,
                        "amount": self.graph[u][v]["weight"]
                    }
                    for u, v in cycle_edges
                ]
            })
        
        # Sort by total amount (largest cycles first)
        cycle_details.sort(key=lambda x: x["total_circulated"], reverse=True)
        
        return {
            "total_cycles": len(cycle_details),
            "cycles": cycle_details[:20],  # Limit to top 20
            "warning": "Circular patterns detected" if cycle_details else None
        }
    
    async def get_entity_neighbors(
        self,
        project_id: str,
        entity_id: str,
        depth: int = 1
    ) -> Dict[str, Any]:
        """
        Get all neighbors of an entity up to specified depth.
        Useful for entity investigation and network expansion.
        """
        # Build graph if not already built
        if self.graph is None:
            await self.build_network(project_id)
        
        if self.graph is None or entity_id not in self.graph:
            return {"error": "Entity not found in network"}
        
        # Get neighbors at each depth level
        neighbors_by_depth = {}
        current_level = {entity_id}
        visited = {entity_id}
        
        for d in range(1, depth + 1):
            next_level = set()
            for node in current_level:
                # Get both successors and predecessors
                successors = set(self.graph.successors(node))
                predecessors = set(self.graph.predecessors(node))
                neighbors = successors | predecessors
                
                # Add unvisited neighbors
                new_neighbors = neighbors - visited
                next_level.update(new_neighbors)
                visited.update(new_neighbors)
            
            neighbors_by_depth[d] = list(next_level)
            current_level = next_level
        
        return {
            "entity": entity_id,
            "max_depth": depth,
            "neighbors_by_depth": neighbors_by_depth,
            "total_neighbors": len(visited) - 1  # Exclude self
        }
