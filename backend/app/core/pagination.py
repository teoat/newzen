"""
Pagination utilities for database queries
Provides consistent pagination across all API endpoints
"""

from typing import Any, List, Optional, Tuple, TypeVar, Generic
from sqlmodel import SQLModel, Session, select, func
from pydantic import BaseModel

T = TypeVar('T', bound=SQLModel)

class PaginationParams(BaseModel):
    """Standard pagination parameters"""
    limit: int = 100
    offset: int = 0
    max_limit: int = 1000  # Maximum allowed limit
    
    def __post_init__(self):
        # Validate and clamp limits
        if self.limit <= 0:
            self.limit = 100
        if self.limit > self.max_limit:
            self.limit = self.max_limit
        if self.offset < 0:
            self.offset = 0

class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response format"""
    items: List[T]
    total: int
    limit: int
    offset: int
    has_more: bool
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        limit: int,
        offset: int
    ) -> "PaginatedResponse[T]":
        return cls(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            has_more=offset + limit < total
        )

def paginate_query(
    db: Session,
    model_class: TypeVar('T'),
    pagination: PaginationParams,
    filters: Optional[Any] = None,
    order_by: Optional[Any] = None
) -> Tuple[List[Any], int]:
    """
    Execute a paginated query and return items + total count
    
    Args:
        db: Database session
        model_class: SQLModel class to query
        pagination: PaginationParams
        filters: Optional filters to apply
        order_by: Optional order by clause
        
    Returns:
        Tuple of (items, total_count)
    """
    # Build base query
    query = select(model_class)
    
    # Apply filters if provided
    if filters is not None:
        query = query.where(filters)
    
    # Get total count
    count_query = select(func.count(model_class.__table__.columns[0]))
    if filters is not None:
        count_query = count_query.where(filters)
    
    total = db.exec(count_query).one()
    
    # Apply ordering and pagination
    if order_by is not None:
        query = query.order_by(order_by)
    
    query = query.limit(pagination.limit).offset(pagination.offset)
    
    # Execute query
    items = db.exec(query).all()
    
    return items, total

def apply_pagination_to_existing_query(
    db: Session,
    query: Any,
    model_class: TypeVar('ModelT'),
    pagination: PaginationParams
) -> Tuple[List[Any], int]:
    """
    Apply pagination to an existing query
    
    Args:
        db: Database session
        query: Existing SQLAlchemy query
        model_class: Model class for counting
        pagination: PaginationParams
        
    Returns:
        Tuple of (items, total_count)
    """
    # Get total count from the query
    total_query = select(func.count(model_class.__table__.columns[0]))
    
    # Copy filters from original query (this is a simplified approach)
    # In production, you might want more sophisticated query parsing
    try:
        total = db.exec(total_query).one()
    except Exception:
        # Fallback: execute with limit+offset and estimate
        limited_query = query.limit(pagination.limit).offset(pagination.offset)
        items = db.exec(limited_query).all()
        total = pagination.offset + len(items) + (pagination.limit if len(items) == pagination.limit else 0)
        return items, total
    
    # Apply pagination to main query
    paginated_query = query.limit(pagination.limit).offset(pagination.offset)
    items = db.exec(paginated_query).all()
    
    return items, total

# Helper function to quickly paginate common project-based queries
def paginate_by_project(
    db: Session,
    model_class: TypeVar('ModelT'),
    project_id: str,
    pagination: PaginationParams,
    order_by: Optional[Any] = None
) -> PaginatedResponse[Any]:
    """
    Quick pagination for project-scoped queries
    
    Args:
        db: Database session
        model_class: Model with project_id field
        project_id: Project ID to filter by
        pagination: Pagination parameters
        order_by: Optional ordering
        
    Returns:
        PaginatedResponse
    """
    
    # Handle different model types
    if hasattr(model_class, 'project_id'):
        filters = (model_class.project_id == project_id)
    else:
        raise ValueError(f"Model {model_class.__name__} doesn't have project_id field")
    
    items, total = paginate_query(
        db=db,
        model_class=model_class,
        pagination=pagination,
        filters=filters,
        order_by=order_by
    )
    
    return PaginatedResponse.create(
        items=items,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset
    )