#!/bin/bash

# Set the backup directory
BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pos_db_backup_$TIMESTAMP.sql"

# Create the backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Database connection details from docker-compose.yml
DB_SERVICE="db"
DB_NAME="pos_db"
DB_USER="user"

echo "Creating backup of database '$DB_NAME'..."

# Execute pg_dump inside the container
docker compose exec -T "$DB_SERVICE" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
else
  echo "Backup failed."
  rm "$BACKUP_FILE"
fi
