"""
Semantic Matcher for Transaction Descriptions
Uses sentence transformers for concept-based matching
"""

from typing import List, Dict, Tuple, Optional
import numpy as np
from dataclasses import dataclass


@dataclass
class MatchResult:
    """Result of semantic matching"""
    index: int
    text: str
    similarity: float
    is_match: bool


class SemanticMatcher:
    """
    Performs semantic matching using sentence embeddings
    Finds conceptually similar text even with different wording
    """
    
    def __init__(self, model_name: str = "paraphrase-MiniLM-L6-v2", threshold: float = 0.7):
        """
        Initialize semantic matcher
        
        Args:
            model_name: Sentence transformer model to use
            threshold: Similarity threshold for matches (0-1)
        """
        self.threshold = threshold
        self.model = None
        self.model_name = model_name
        
        # Lazy load model
        self._embeddings_cache: Dict[str, np.ndarray] = {}
    
    def _load_model(self):
        """Lazy load the sentence transformer model"""
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.model_name)
            except ImportError:
                raise ImportError(
                    "sentence-transformers not installed. "
                    "Run: pip install sentence-transformers"
                )
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """
        Get embedding for text (with caching)
        
        Args:
            text: Text to embed
        
        Returns:
            Embedding vector
        """
        # Normalize text
        text = text.lower().strip()
        
        # Check cache
        if text in self._embeddings_cache:
            return self._embeddings_cache[text]
        
        # Load model if needed
        self._load_model()
        
        # Generate embedding
        embedding = self.model.encode(text, convert_to_numpy=True)
        
        # Cache it
        self._embeddings_cache[text] = embedding
        
        return embedding
    
    def similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts
        
        Args:
            text1: First text
            text2: Second text
        
        Returns:
            Similarity score (0-1), where 1 is identical
        """
        emb1 = self._get_embedding(text1)
        emb2 = self._get_embedding(text2)
        
        # Calculate cosine similarity
        similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        
        return float(similarity)
    
    def find_matches(
        self,
        query: str,
        candidates: List[str],
        top_k: Optional[int] = None
    ) -> List[MatchResult]:
        """
        Find semantically similar candidates for a query
        
        Args:
            query: Query text to match
            candidates: List of candidate texts
            top_k: Return only top K matches (None for all above threshold)
        
        Returns:
            List of MatchResult objects, sorted by similarity (descending)
        """
        query_emb = self._get_embedding(query)
        
        # Calculate similarities
        results: List[MatchResult] = []
        
        for i, candidate in enumerate(candidates):
            candidate_emb = self._get_embedding(candidate)
            
            # Cosine similarity
            sim = np.dot(query_emb, candidate_emb) / (
                np.linalg.norm(query_emb) * np.linalg.norm(candidate_emb)
            )
            
            results.append(MatchResult(
                index=i,
                text=candidate,
                similarity=float(sim),
                is_match=float(sim) >= self.threshold
            ))
        
        # Sort by similarity (descending)
        results.sort(key=lambda x: x.similarity, reverse=True)
        
        # Return top K or all matches
        if top_k:
            return results[:top_k]
        else:
            return [r for r in results if r.is_match]
    
    def match_descriptions(
        self,
        source_descriptions: List[str],
        target_descriptions: List[str],
        threshold: Optional[float] = None
    ) -> List[Tuple[int, int, float]]:
        """
        Match two lists of descriptions
        
        Args:
            source_descriptions: Source list
            target_descriptions: Target list
            threshold: Override default threshold
        
        Returns:
            List of (source_idx, target_idx, similarity) tuples
        """
        threshold = threshold or self.threshold
        matches: List[Tuple[int, int, float]] = []
        
        # Get embeddings for all descriptions
        source_embs = [self._get_embedding(desc) for desc in source_descriptions]
        target_embs = [self._get_embedding(desc) for desc in target_descriptions]
        
        # Find matches
        for i, src_emb in enumerate(source_embs):
            best_match_idx = -1
            best_similarity = 0.0
            
            for j, tgt_emb in enumerate(target_embs):
                sim = np.dot(src_emb, tgt_emb) / (
                    np.linalg.norm(src_emb) * np.linalg.norm(tgt_emb)
                )
                
                if sim > best_similarity:
                    best_similarity = sim
                    best_match_idx = j
            
            # Add if above threshold
            if best_similarity >= threshold:
                matches.append((i, best_match_idx, float(best_similarity)))
        
        return matches
    
    def batch_similarity(
        self,
        texts: List[Tuple[str, str]]
    ) -> List[float]:
        """
        Calculate similarities for a batch of text pairs
        
        Args:
            texts: List of (text1, text2) tuples
        
        Returns:
            List of similarity scores
        """
        similarities = []
        
        for text1, text2 in texts:
            sim = self.similarity(text1, text2)
            similarities.append(sim)
        
        return similarities
    
    def clear_cache(self):
        """Clear the embeddings cache"""
        self._embeddings_cache.clear()
    
    def get_cache_size(self) -> int:
        """Get number of cached embeddings"""
        return len(self._embeddings_cache)


# Global instance
_matcher: Optional[SemanticMatcher] = None


def get_semantic_matcher(threshold: float = 0.7) -> SemanticMatcher:
    """Get or create global semantic matcher instance"""
    global _matcher
    if _matcher is None:
        _matcher = SemanticMatcher(threshold=threshold)
    return _matcher


# Example usage for transaction matching
def match_transactions_semantically(
    source_transactions: List[Dict],
    target_transactions: List[Dict],
    description_field: str = "description",
    threshold: float = 0.75
) -> List[Dict]:
    """
    Match transactions using semantic similarity
    
    Args:
        source_transactions: Source transaction list
        target_transactions: Target transaction list
        description_field: Field name containing description
        threshold: Similarity threshold
    
    Returns:
        List of match dictionaries with source_idx, target_idx, similarity
    """
    matcher = get_semantic_matcher(threshold=threshold)
    
    # Extract descriptions
    source_descs = [tx.get(description_field, "") for tx in source_transactions]
    target_descs = [tx.get(description_field, "") for tx in target_transactions]
    
    # Find matches
    raw_matches = matcher.match_descriptions(source_descs, target_descs, threshold)
    
    # Format results
    matches = []
    for src_idx, tgt_idx, similarity in raw_matches:
        matches.append({
            "source_index": src_idx,
            "target_index": tgt_idx,
            "similarity": similarity,
            "source_description": source_descs[src_idx],
            "target_description": target_descs[tgt_idx],
            "match_type": "semantic"
        })
    
    return matches
