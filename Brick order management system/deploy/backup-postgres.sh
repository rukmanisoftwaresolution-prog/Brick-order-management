#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to a PostgreSQL connection string}"
: "${BACKUP_DIR:?Set BACKUP_DIR to a protected backup directory}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/brick_orders_${timestamp}.dump"

pg_dump "$DATABASE_URL" --format=custom --no-owner --file="$backup_file"
chmod 600 "$backup_file"
find "$BACKUP_DIR" -type f -name 'brick_orders_*.dump' -mtime +14 -delete
