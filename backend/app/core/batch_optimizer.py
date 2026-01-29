"""
Batch Optimizer - Dynamic batch sizing based on system resources.
Prevents system overload by adjusting batch sizes and concurrency.
"""

import psutil
from typing import Dict, Any, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class SystemResources:
    """Current system resource utilization."""

    cpu_percent: float
    memory_available_gb: float
    disk_io_wait: float


@dataclass
class BatchConfig:
    """Optimized batch configuration."""

    size: int
    concurrent_batches: int
    delay_between_batches_ms: int


class BatchOptimizer:
    """
    Dynamically calculates optimal batch sizes based on system load.
    """

    # Default configurations for different data types
    DEFAULT_BATCH_SIZES = {
        "transaction": 500,
        "entity": 200,
        "embedding": 100,  # More CPU intensive
        "reconciliation": 300,
        "document": 150,
    }
    # Resource thresholds
    CPU_THRESHOLD_LOW = 50.0  # < 50% CPU: Increase batch size
    CPU_THRESHOLD_HIGH = 80.0  # > 80% CPU: Decrease batch size
    MEMORY_THRESHOLD_GB = 2.0  # Minimum 2GB free RAM required

    @staticmethod
    def get_system_resources() -> SystemResources:
        """Get current system resource utilization."""
        try:
            cpu = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory().available / (1024**3)  # GB
            # Get disk I/O wait (platform-specific)
            try:
                disk_io = psutil.cpu_times_percent(interval=1).iowait
            except AttributeError:
                # iowait not available on all platforms (e.g., macOS)
                disk_io = 0.0
            return SystemResources(
                cpu_percent=cpu, memory_available_gb=memory, disk_io_wait=disk_io
            )
        except Exception as e:
            logger.warning(f"Failed to get system resources: {e}")
            # Return conservative defaults
            return SystemResources(cpu_percent=75.0, memory_available_gb=2.0, disk_io_wait=10.0)

    @classmethod
    def calculate_batch_config(
        cls, data_type: str, total_items: int, resources: Optional[SystemResources] = None
    ) -> BatchConfig:
        """
        Calculate optimal batch configuration.
        Args:
            data_type: Type of data being processed
            total_items: Total number of items to process
            resources: Current system resources (auto-detected if None)
        Returns:
            BatchConfig with optimized parameters
        """
        if resources is None:
            resources = cls.get_system_resources()
        base_size = cls.DEFAULT_BATCH_SIZES.get(data_type, 250)
        # Adjust based on CPU load
        if resources.cpu_percent < cls.CPU_THRESHOLD_LOW:
            # System has capacity, increase batch size
            batch_size = int(base_size * 1.5)
            concurrent = 4
            delay = 100  # ms
        elif resources.cpu_percent > cls.CPU_THRESHOLD_HIGH:
            # System is stressed, decrease batch size
            batch_size = int(base_size * 0.5)
            concurrent = 2
            delay = 500  # ms
        else:
            # Normal operation
            batch_size = base_size
            concurrent = 3
            delay = 200  # ms
        # Adjust based on memory
        if resources.memory_available_gb < cls.MEMORY_THRESHOLD_GB:
            logger.warning(f"Low memory detected: {resources.memory_available_gb:.2f}GB")
            batch_size = int(batch_size * 0.5)
            concurrent = max(1, concurrent - 1)
        # Cap concurrent batches based on total items
        max_concurrent = min(concurrent, max(1, total_items // batch_size))
        logger.info(
            f"Batch config for {data_type}: "
            f"size={batch_size}, concurrent={max_concurrent}, "
            f"delay={delay}ms (CPU={resources.cpu_percent:.1f}%, "
            f"RAM={resources.memory_available_gb:.2f}GB)"
        )
        return BatchConfig(
            size=batch_size,
            concurrent_batches=max_concurrent,
            delay_between_batches_ms=delay,
        )

    @classmethod
    def get_health_status(cls) -> Dict[str, Any]:
        """Get current system health status."""
        resources = cls.get_system_resources()
        # Determine health status
        if resources.cpu_percent > 95:
            status = "critical"
            message = "CPU critically high"
        elif resources.memory_available_gb < 1.0:
            status = "critical"
            message = "Memory critically low"
        elif resources.cpu_percent > 80 or resources.memory_available_gb < 2.0:
            status = "warning"
            message = "System under stress"
        else:
            status = "healthy"
            message = "System operating normally"
        return {
            "status": status,
            "message": message,
            "cpu_percent": resources.cpu_percent,
            "memory_available_gb": resources.memory_available_gb,
            "disk_io_wait": resources.disk_io_wait,
        }
