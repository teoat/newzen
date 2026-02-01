from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.core.db import engine
from app.modules.ai.frenly_context import REDIS_AVAILABLE
import redis
import psutil
from datetime import datetime, UTC

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/database")
async def database_health():
    """Check database connectivity and basic stats"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            await conn.commit()
            
        # Get additional database info
        with engine.connect() as conn:
            if engine.dialect.name == "sqlite":
                result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
                tables = [row[0] for row in result.fetchall()]
                stats = {"tables": len(tables), "database_type": "SQLite"}
            else:
                result = conn.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"))
                table_count = result.scalar()
                stats = {"tables": table_count, "database_type": "PostgreSQL"}
        
        return {
            "status": "healthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "database": stats,
            "connection": "successful"
        }
    except SQLAlchemyError as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e),
            "connection": "failed"
        }

@router.get("/redis")
async def redis_health():
    """Check Redis connectivity and memory usage"""
    try:
        redis_client = redis.Redis(host="localhost", port=6379, db=2, decode_responses=True)
        redis_client.ping()
        
        # Get Redis info
        info = redis_client.info()
        memory_info = redis_client.info("memory")
        
        return {
            "status": "healthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "redis": {
                "connected": True,
                "memory_used": memory_info.get("used_memory_human", "N/A"),
                "total_keys": redis_client.dbsize(),
                "version": info.get("redis_version", "N/A")
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e),
            "connected": False
        }

@router.get("/system")
async def system_health():
    """Check system resources and performance"""
    try:
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        cpu_percent = psutil.cpu_percent(interval=1)
        
        return {
            "status": "healthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "system": {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total": f"{memory.total / (1024**3):.1f}GB",
                    "available": f"{memory.available / (1024**3):.1f}GB",
                    "percent": memory.percent,
                    "used": f"{memory.used / (1024**3):.1f}GB"
                },
                "disk": {
                    "total": f"{disk.total / (1024**3):.1f}GB",
                    "free": f"{disk.free / (1024**3):.1f}GB",
                    "percent": (disk.used / disk.total) * 100
                }
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e)
        }

@router.get("/ai-context")
async def ai_context_health():
    """Check AI context store health"""
    try:
        from app.modules.ai.frenly_context import FrenlyContextBuilder
        
        return {
            "status": "healthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "ai_context": {
                "redis_available": REDIS_AVAILABLE,
                "context_ttl": FrenlyContextBuilder.CONTEXT_TTL,
                "max_alerts": FrenlyContextBuilder.MAX_ALERTS
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "error": str(e)
        }

@router.get("/")
async def overall_health():
    """Overall system health status"""
    # Check all components
    db_health = await database_health()
    redis_health_response = await redis_health()
    system_health_response = await system_health()
    ai_health = await ai_context_health()
    
    # Determine overall status
    components = [db_health, redis_health_response, system_health_response, ai_health]
    unhealthy = [c for c in components if c.get("status") == "unhealthy"]
    
    overall_status = "degraded" if unhealthy else "healthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now(UTC).isoformat(),
        "components": {
            "database": db_health.get("status", "unknown"),
            "redis": redis_health_response.get("status", "unknown"),
            "system": system_health_response.get("status", "unknown"),
            "ai_context": ai_health.get("status", "unknown")
        },
        "unhealthy_components": len(unhealthy),
        "total_components": len(components)
    }