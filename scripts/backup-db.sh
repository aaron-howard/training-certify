#!/usr/bin/env bash
# Create a gzipped pg_dump of DATABASE_URL.
# Usage:
#   DATABASE_URL=postgresql://... ./scripts/backup-db.sh
#   BACKUP_DIR=./backups RETENTION_DAYS=7 ./scripts/backup-db.sh

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DATE="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"

mkdir -p "${BACKUP_DIR}"

echo "Starting database backup..."
pg_dump "${DATABASE_URL}" >"${BACKUP_FILE}"
gzip -f "${BACKUP_FILE}"
echo "Backup written: ${BACKUP_FILE}.gz"

# Clean up old backups (best-effort; skip if find fails)
if find "${BACKUP_DIR}" -name 'backup_*.sql.gz' -mtime "+${RETENTION_DAYS}" -print -delete 2>/dev/null; then
  echo "Removed backups older than ${RETENTION_DAYS} days (if any)"
fi

echo "Backup complete"
