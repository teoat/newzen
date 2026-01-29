"""
Zenith Batch Processor Utility
Provides intelligent chunking for large CSV datasets to maximize system capacity
"""


def chunk_data(data: list, chunk_size: int = 3000):
    """
    Split a large list into smaller chunks for batched processing.
    Args:
        data: List of records to chunk
        chunk_size: Maximum records per chunk (default: 3000)
    Returns:
        Generator yielding chunks of data
    """
    for i in range(0, len(data), chunk_size):
        yield data[i:i + chunk_size]


def calculate_optimal_batch_size(
    total_rows: int, max_batch_size: int = 3000, min_batch_size: int = 1000
):
    """
    Calculate optimal batch size based on dataset size to minimize total batches
    while respecting system constraints.
    Strategy:
    - For datasets < 3000: Process in single batch
    - For datasets 3000-10000: Use fixed 3000-row batches
    - For datasets > 10000: Calculate even distribution to minimize remainder
    Args:
        total_rows: Total number of rows in dataset
        max_batch_size: Maximum rows per batch
        min_batch_size: Minimum rows per batch to avoid too many tiny batches
    Returns:
        Optimal batch size
    """
    if total_rows <= max_batch_size:
        return total_rows
    # Calculate number of batches needed with max size
    num_batches = (total_rows + max_batch_size - 1) // max_batch_size
    # Distribute evenly to avoid small final batch
    optimal_size = (total_rows + num_batches - 1) // num_batches
    # Ensure we don't go below minimum
    return max(optimal_size, min_batch_size)


class BatchProgress:
    """
    Track progress across multiple batches for real-time feedback
    """

    def __init__(self, total_batches: int):
        self.total_batches = total_batches
        self.completed_batches = 0
        self.failed_batches = 0
        self.records_processed = 0

    def increment(self, records: int = 0):
        self.completed_batches += 1
        self.records_processed += records

    def mark_failed(self):
        self.failed_batches += 1

    def get_progress_percent(self) -> float:
        if self.total_batches == 0:
            return 100.0
        return (self.completed_batches / self.total_batches) * 100

    def is_complete(self) -> bool:
        return (self.completed_batches + self.failed_batches) >= self.total_batches

    def get_status_summary(self) -> dict:
        return {
            "total_batches": self.total_batches,
            "completed": self.completed_batches,
            "failed": self.failed_batches,
            "records_processed": self.records_processed,
            "progress_percent": self.get_progress_percent(),
            "is_complete": self.is_complete(),
        }
