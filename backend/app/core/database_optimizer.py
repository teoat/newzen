"""
Database query optimization utilities
Provides caching, indexing strategies, and performance monitoring
"""

import time
import json
import hashlib
from typing import Any, Dict, List, Optional, TypeVar
from functools import wraps
from sqlmodel import SQLModel, Session, text
from sqlalchemy import Index
from datetime import datetime, UTC

T = TypeVar('T', bound=SQLModel)


class QueryCache:
    """
    Redis-based query cache with TTL and invalidation
    """
    
    def __init__(self, redis_client=None, default_ttl: int = 300):
        self.redis = redis_client or redis_client
        self.default_ttl = default_ttl
    
    def _generate_cache_key(self, query: str, params: Dict[str, Any] = None) -> str:
        """Generate deterministic cache key from query and parameters"""
        key_data = {
            'query': query,
            'params': params or {}
        }
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return f"query_cache:{hashlib.md5(key_str.encode()).hexdigest()}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached result"""
        try:
            cached = self.redis.get(key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Cache result with TTL"""
        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value, default=str)
            return self.redis.setex(key, ttl, serialized)
        except Exception:
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern"""
        try:
            keys = self.redis.keys(pattern)
            if keys:
                return self.redis.delete(*keys)
        except Exception:
            pass
        return 0


class DatabaseOptimizer:
    """
    Database performance optimization utilities
    """
    
    def __init__(self, cache: QueryCache = None):
        self.cache = cache or QueryCache()
        self.query_stats: Dict[str, Dict[str, Any]] = {}
    
    def analyze_query_performance(self, query_name: str, duration: float, result_count: int):
        """Track query performance metrics"""
        if query_name not in self.query_stats:
            self.query_stats[query_name] = {
                'total_executions': 0,
                'total_duration': 0.0,
                'total_results': 0,
                'avg_duration': 0.0,
                'avg_results': 0.0,
                'max_duration': 0.0,
                'last_executed': None
            }
        
        stats = self.query_stats[query_name]
        stats['total_executions'] += 1
        stats['total_duration'] += duration
        stats['total_results'] += result_count
        stats['avg_duration'] = stats['total_duration'] / stats['total_executions']
        stats['avg_results'] = stats['total_results'] / stats['total_executions']
        stats['max_duration'] = max(stats['max_duration'], duration)
        stats['last_executed'] = datetime.now(UTC)
    
    def get_optimized_transactions_query(
        self,
        project_id: str,
        limit: int = 1000,
        offset: int = 0,
        filters: Dict[str, Any] = None,
        order_by: str = 'transaction_date'
    ):
        """Get optimized transactions query with proper indexing hints"""
        base_query = text("""
            SELECT * FROM transaction 
            WHERE project_id = :project_id
            AND (:status_filter IS NULL OR status = :status_filter)
            AND (:category_filter IS NULL OR category_code = :category_filter)
            AND (:risk_min IS NULL OR risk_score >= :risk_min)
            AND (:risk_max IS NULL OR risk_score <= :risk_max)
            ORDER BY {order_by}
            LIMIT :limit OFFSET :offset
        """.format(order_by=order_by))
        
        params = {
            'project_id': project_id,
            'status_filter': filters.get('status') if filters else None,
            'category_filter': filters.get('category_code') if filters else None,
            'risk_min': filters.get('risk_min') if filters else None,
            'risk_max': filters.get('risk_max') if filters else None,
            'limit': limit,
            'offset': offset
        }
        
        return base_query, params
    
    def get_aggregated_query(
        self,
        project_id: str,
        aggregation_type: str = 'summary',
        date_range: Dict[str, str] = None
    ):
        """Get pre-aggregated data for dashboard performance"""
        if aggregation_type == 'summary':
            query = text("""
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(actual_amount) as total_amount,
                    AVG(risk_score) as avg_risk_score,
                    COUNT(CASE WHEN status = 'flagged' THEN 1 END) as flagged_count,
                    COUNT(CASE WHEN category_code = 'XP' THEN 1 END) as personal_expenses,
                    SUM(CASE WHEN delta_inflation > 0 THEN delta_inflation ELSE 0 END) as total_inflation
                FROM transaction 
                WHERE project_id = :project_id
                AND (:start_date IS NULL OR transaction_date >= :start_date)
                AND (:end_date IS NULL OR transaction_date <= :end_date)
            """)
        elif aggregation_type == 'daily':
            query = text("""
                SELECT 
                    DATE(transaction_date) as date,
                    COUNT(*) as transaction_count,
                    SUM(actual_amount) as daily_amount,
                    AVG(risk_score) as avg_risk
                FROM transaction 
                WHERE project_id = :project_id
                AND (:start_date IS NULL OR transaction_date >= :start_date)
                AND (:end_date IS NULL OR transaction_date <= :end_date)
                GROUP BY DATE(transaction_date)
                ORDER BY date DESC
            """)
        elif aggregation_type == 'category':
            query = text("""
                SELECT 
                    category_code,
                    COUNT(*) as count,
                    SUM(actual_amount) as total_amount,
                    AVG(risk_score) as avg_risk_score
                FROM transaction 
                WHERE project_id = :project_id
                AND (:start_date IS NULL OR transaction_date >= :start_date)
                AND (:end_date IS NULL OR transaction_date <= :end_date)
                GROUP BY category_code
                ORDER BY total_amount DESC
            """)
        
        params = {
            'project_id': project_id,
            'start_date': date_range.get('start') if date_range else None,
            'end_date': date_range.get('end') if date_range else None
        }
        
        return query, params
    
    def cached_query(self, ttl: int = 300, key_prefix: str = ""):
        """Decorator for caching database queries"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key_data = {
                    'func': func.__name__,
                    'args': args,
                    'kwargs': kwargs
                }
                cache_key = f"{key_prefix}_{hashlib.md5(json.dumps(cache_key_data, sort_keys=True, default=str).encode()).hexdigest()}"
                
                # Try cache first
                cached_result = self.cache.get(cache_key)
                if cached_result is not None:
                    return cached_result
                
                # Execute query
                start_time = time.time()
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Cache result
                if isinstance(result, (list, dict)):
                    self.cache.set(cache_key, result, ttl)
                
                # Track performance
                result_count = len(result) if isinstance(result, list) else 1
                self.analyze_query_performance(func.__name__, duration, result_count)
                
                return result
            return wrapper
        return decorator


# Global optimizer instance
db_optimizer = DatabaseOptimizer()


def create_database_indexes():
    """Create performance indexes for common query patterns"""
    indexes = [
        # Transaction table indexes
        Index('idx_transaction_project_date', 'project_id', 'transaction_date'),
        Index('idx_transaction_project_status', 'project_id', 'status'),
        Index('idx_transaction_project_category', 'project_id', 'category_code'),
        Index('idx_transaction_risk_score', 'risk_score'),
        Index('idx_transaction_project_risk', 'project_id', 'risk_score'),
        Index('idx_transaction_receiver', 'receiver'),
        Index('idx_transaction_amount', 'actual_amount'),
        
        # Bank transaction indexes
        Index('idx_bank_tx_project_date', 'bank_transaction.project_id', 'bank_transaction.timestamp'),
        Index('idx_bank_tx_amount', 'bank_transaction.amount'),
        
        # Reconciliation match indexes
        Index('idx_reconciliation_project', 'reconciliation_match.project_id'),
        Index('idx_reconciliation_status', 'reconciliation_match.status'),
        Index('idx_reconciliation_confirmed', 'reconciliation_match.confirmed'),
        
        # Audit log indexes
        Index('idx_audit_timestamp', 'audit_log.timestamp'),
        Index('idx_audit_entity', 'audit_log.entity_type', 'audit_log.entity_id'),
        
        # Investigation indexes
        Index('idx_investigation_status', 'investigation.status'),
        Index('idx_investigation_project', 'investigation.project_id'),
    ]
    
    return indexes


def get_slow_queries(threshold_ms: float = 1000.0) -> List[Dict[str, Any]]:
    """Get queries exceeding performance threshold"""
    slow_queries = []
    for query_name, stats in db_optimizer.query_stats.items():
        if stats['avg_duration'] > (threshold_ms / 1000):
            slow_queries.append({
                'query_name': query_name,
                'avg_duration_ms': stats['avg_duration'] * 1000,
                'max_duration_ms': stats['max_duration'] * 1000,
                'total_executions': stats['total_executions'],
                'avg_results': stats['avg_results']
            })
    
    return sorted(slow_queries, key=lambda x: x['avg_duration_ms'], reverse=True)


def invalidate_project_cache(project_id: str):
    """Invalidate all cache entries for a specific project"""
    patterns = [
        f"query_cache:*{project_id}*",
        f"reconciliation_cache:*{project_id}*",
        f"dashboard_cache:*{project_id}*"
    ]
    
    total_invalidated = 0
    for pattern in patterns:
        total_invalidated += db_optimizer.cache.invalidate_pattern(pattern)
    
    return total_invalidated


def optimize_transaction_query(
    session: Session,
    project_id: str,
    limit: int = 1000,
    offset: int = 0,
    filters: Optional[Dict[str, Any]] = None
):
    """Execute optimized transaction query with caching"""
    cache_key = f"transactions_{project_id}_{limit}_{offset}_{hashlib.md5(json.dumps(filters or {}, sort_keys=True).encode()).hexdigest()}"
    
    # Try cache first
    cached = db_optimizer.cache.get(cache_key)
    if cached:
        return cached
    
    # Use optimized query
    query, params = db_optimizer.get_optimized_transactions_query(
        project_id=project_id,
        limit=limit,
        offset=offset,
        filters=filters
    )
    
    start_time = time.time()
    result = session.execute(query, params).fetchall()
    duration = time.time() - start_time
    
    # Convert to list of dicts
    transactions = [dict(row._mapping) for row in result]
    
    # Cache result
    db_optimizer.cache.set(cache_key, transactions, ttl=300)
    db_optimizer.analyze_query_performance('optimized_transactions', duration, len(transactions))
    
    return transactions