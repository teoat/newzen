#!/bin/bash

# Automated Database Backup Script
# Creates compressed, encrypted, and timestamped backups

set -e

# Configuration
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-zenith_lite}"
DB_USER="${POSTGRES_USER:-zenith}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
COMPRESS="${BACKUP_COMPRESS:-true}"
ENCRYPT="${BACKUP_ENCRYPT:-false}"
GPG_RECIPIENT="${GPG_RECIPIENT:-backup@zenith.local}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    mkdir -p "$BACKUP_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log" 2>/dev/null || echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$BACKUP_DIR/backup.log"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$BACKUP_DIR/backup.log"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$BACKUP_DIR/backup.log"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$BACKUP_DIR/backup.log"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${DB_NAME}_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
ENCRYPTED_FILE="${COMPRESSED_FILE}.gpg"

log "Starting database backup: ${DB_NAME} at ${DB_HOST}:${DB_PORT}"
log "Backup file: ${BACKUP_FILE}"

# Test database connection
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; then
    error "Database connection failed"
    exit 1
fi

success "Database connection verified"

# Create database backup
info "Creating database dump..."
if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="$BACKUP_FILE"; then
    
    success "Database backup created: ${BACKUP_FILE}"
else
    error "Database backup failed"
    exit 1
fi

# Get backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup size: ${BACKUP_SIZE}"

# Compress backup if enabled
if [ "$COMPRESS" = "true" ]; then
    info "Compressing backup..."
    if gzip -c "$BACKUP_FILE" > "$COMPRESSED_FILE"; then
        success "Backup compressed: ${COMPRESSED_FILE}"
        COMPRESSED_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log "Compressed size: ${COMPRESSED_SIZE} (reduced by $(echo "scale=1; (($(du -k "$BACKUP_FILE" | cut -f1) - $(du -k "$COMPRESSED_FILE" | cut -f1)) * 100) / $(du -k "$BACKUP_FILE" | cut -f1))" | bc)%)"
        
        # Remove uncompressed file
        rm "$BACKUP_FILE"
        BACKUP_FILE="$COMPRESSED_FILE"
    else
        warning "Compression failed, keeping uncompressed backup"
    fi
fi

# Encrypt backup if enabled
if [ "$ENCRYPT" = "true" ] && command -v gpg >/dev/null 2>&1; then
    info "Encrypting backup..."
    if gpg --batch --yes --recipient "$GPG_RECIPIENT" --output "$ENCRYPTED_FILE" --encrypt "$BACKUP_FILE"; then
        success "Backup encrypted: ${ENCRYPTED_FILE}"
        
        # Remove unencrypted file
        rm "$BACKUP_FILE"
        BACKUP_FILE="$ENCRYPTED_FILE"
    else
        warning "Encryption failed, keeping unencrypted backup"
    fi
elif [ "$ENCRYPT" = "true" ]; then
    warning "GPG not available, skipping encryption"
fi

# Create backup metadata
METADATA_FILE="${BACKUP_FILE}.meta"
cat > "$METADATA_FILE" << EOF
Backup Metadata
===============
Database: ${DB_NAME}
Host: ${DB_HOST}:${DB_PORT}
User: ${DB_USER}
Created: $(date)
Timestamp: ${TIMESTAMP}
File: ${BACKUP_FILE}
Size: $(du -h "$BACKUP_FILE" | cut -f1)
Compressed: ${COMPRESS}
Encrypted: ${ENCRYPT}
PostgreSQL Version: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();" | head -1)
EOF

success "Metadata created: ${METADATA_FILE}"

# Verify backup integrity
info "Verifying backup integrity..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    if gzip -t "$BACKUP_FILE"; then
        success "Backup integrity verified"
    else
        error "Backup integrity check failed"
        exit 1
    fi
elif [[ "$BACKUP_FILE" == *.gpg ]]; then
    if gpg --list-only "$BACKUP_FILE" >/dev/null 2>&1; then
        success "Encrypted backup integrity verified"
    else
        error "Encrypted backup integrity check failed"
        exit 1
    fi
fi

# Cleanup old backups
info "Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=0
if [ "$RETENTION_DAYS" -gt 0 ]; then
    while IFS= read -r -d '' old_backup; do
        rm "$old_backup"
        log "Deleted old backup: $old_backup"
        ((DELETED_COUNT++))
    done < <(find "$BACKUP_DIR" -name "*backup_*.sql*" -type f -mtime "+$RETENTION_DAYS" -print0)
    
    if [ "$DELETED_COUNT" -gt 0 ]; then
        success "Deleted ${DELETED_COUNT} old backup(s)"
    else
        info "No old backups to delete"
    fi
fi

# Create backup summary
echo
log "BACKUP SUMMARY"
echo "============"
echo "Database: ${DB_NAME}"
echo "File: ${BACKUP_FILE}"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "Timestamp: ${TIMESTAMP}"
echo "Compressed: ${COMPRESS}"
echo "Encrypted: ${ENCRYPT}"
echo "Retention: ${RETENTION_DAYS} days"
echo "Old backups deleted: ${DELETED_COUNT}"
echo "Total backups in directory: $(find "$BACKUP_DIR" -name "*backup_*.sql*" -type f | wc -l)"

# Send notification (if configured)
if [ -n "$BACKUP_NOTIFICATION_URL" ]; then
    info "Sending backup notification..."
    curl -X POST "$BACKUP_NOTIFICATION_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"database\": \"${DB_NAME}\",
            \"file\": \"${BACKUP_FILE}\",
            \"size\": \"$(du -h "$BACKUP_FILE" | cut -f1)\",
            \"timestamp\": \"${TIMESTAMP}\",
            \"success\": true
        }" || warning "Failed to send notification"
fi

success "Database backup completed successfully!"

# Show disk usage
info "Backup directory usage: $(du -sh "$BACKUP_DIR" | cut -f1)"

exit 0