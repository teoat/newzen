# Builder Stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Setup Virtual Environment
ENV VIRTUAL_ENV=/app/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install uv (The fastest Python package installer)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
ENV UV_HTTP_TIMEOUT=300

# Install heavy dependencies first (Cached Layer)
COPY requirements-heavy.txt .
RUN uv pip install --no-cache -p $VIRTUAL_ENV/bin/python -r requirements-heavy.txt

# Install standard dependencies (Frequent Changes)
COPY requirements.txt .
RUN uv pip install --no-cache -p $VIRTUAL_ENV/bin/python -r requirements.txt

# Runtime Stage - Use standard Python for better compatibility
FROM python:3.12-slim

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Create non-root user for security
RUN useradd -m -u 1000 appuser && mkdir -p /app && chown appuser:appuser /app
USER appuser

# Copy application code with correct ownership
COPY --chown=appuser:appuser . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start command - Use venv Python to ensure module resolution
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
