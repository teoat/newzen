from prometheus_client import Gauge
from sqlmodel import Session, select, func
from app.core.db import engine
from app.core.redis_client import redis_client
from app.models import Transaction, Project, UserQueryPattern
import asyncio
import logging

logger = logging.getLogger(__name__)

# Business Metrics
TRANSACTION_TOTAL = Gauge(
    "zenith_transactions_total", "Total number of transactions"
)
PROJECT_TOTAL = Gauge("zenith_projects_total", "Total number of projects")
QUERY_PATTERN_TOTAL = Gauge(
    "zenith_query_patterns_total", "Total number of user query patterns"
)

# Redis Metrics
REDIS_KEYS_TOTAL = Gauge("zenith_redis_keys_total", "Total keys in Redis")
REDIS_HIT_RATE = Gauge("zenith_redis_cache_hit_rate", "Redis cache hit rate")


async def refresh_business_metrics_loop():
    """
    Background task to update business metrics every 60 seconds.
    """
    logger.info("Starting Prometheus metrics refresher...")
    while True:
        try:
            # Run blocking DB/Redis calls in a thread
            # to avoid blocking event loop
            await asyncio.to_thread(_update_sync)
        except Exception as e:
            logger.error(f"Failed to update business metrics: {e}")

        await asyncio.sleep(60)


def _update_sync():
    """Synchronous update logic."""
    try:
        with Session(engine) as db:
            # Update DB Metrics
            tx_count = db.exec(select(func.count(Transaction.id))).one() or 0
            TRANSACTION_TOTAL.set(tx_count)

            proj_count = db.exec(select(func.count(Project.id))).one() or 0
            PROJECT_TOTAL.set(proj_count)

            pat_count = db.exec(
                select(func.count(UserQueryPattern.id))
            ).one() or 0
            QUERY_PATTERN_TOTAL.set(pat_count)

        # Update Redis Metrics
        try:
            info = redis_client.info("stats")
            keyspace = redis_client.info("keyspace")

            total_keys = sum(
                int(db.get("keys", 0)) for db in keyspace.values()
            )
            REDIS_KEYS_TOTAL.set(total_keys)

            hits = int(info.get("keyspace_hits", 0))
            misses = int(info.get("keyspace_misses", 0))
            total = hits + misses
            if total > 0:
                REDIS_HIT_RATE.set(hits / total)
        except Exception as e:
            # Redis might be down, don't crash the loop
            logger.warning(f"Failed to pluck Redis metrics: {e}")

    except Exception as e:
        logger.error(f"Metrics update cycle failed: {e}")
