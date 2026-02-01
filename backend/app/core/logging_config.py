"""
Structured Logging Configuration
Provides JSON-formatted logs for production observability.
"""

import logging
import json
import time
import sys
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class JSONFormatter(logging.Formatter):
    """
    Custom formatter to output logs in JSON format.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "module": record.module,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "extra"):
            log_data.update(record.extra)
            
        return json.dumps(log_data)

def setup_logging():
    """
    Configures the root logger to use JSON formatting.
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(handler)
    
    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log every request and its latency.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        
        # Add request context to logs
        extra = {
            "method": request.method,
            "url": str(request.url),
            "client_ip": request.client.host if request.client else "unknown",
        }
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            extra["status_code"] = response.status_code
            extra["duration_ms"] = round(process_time * 1000, 2)
            
            logging.info(f"Request {request.method} {request.url.path} completed", extra={"extra": extra})
            return response
        except Exception as e:
            process_time = time.time() - start_time
            extra["duration_ms"] = round(process_time * 1000, 2)
            extra["error"] = str(e)
            
            logging.error(f"Request {request.method} {request.url.path} failed: {e}", extra={"extra": extra}, exc_info=True)
            raise
