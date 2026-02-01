#!/bin/bash
set -e

echo "👷 Starting Celery Worker..."
# Run the worker for 'zenith_forensic' app
# Concurrency 2 is usually enough for lite deployments
celery -A app.core.celery_config.celery_app worker --loglevel=info --concurrency=2 -Q ingestion,analysis,reconciliation,embedding,default
