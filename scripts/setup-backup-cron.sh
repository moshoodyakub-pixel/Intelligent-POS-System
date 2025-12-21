#!/bin/bash

# =============================================================================
# Database Backup Cron Job Setup Script
# =============================================================================
# This script sets up an automated daily backup for the POS system database.
# 
# Usage: ./setup-backup-cron.sh [OPTIONS]
#   --hourly    Run backup every hour
#   --daily     Run backup daily at 2 AM (default)
#   --weekly    Run backup weekly on Sunday at 2 AM
#   --remove    Remove the backup cron job
#
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
CRON_LOG="/var/log/pos-backup.log"

# Default schedule: Daily at 2 AM
SCHEDULE="0 2 * * *"

# Parse arguments
case "$1" in
    --hourly)
        SCHEDULE="0 * * * *"
        echo "Setting up hourly backups..."
        ;;
    --daily)
        SCHEDULE="0 2 * * *"
        echo "Setting up daily backups at 2 AM..."
        ;;
    --weekly)
        SCHEDULE="0 2 * * 0"
        echo "Setting up weekly backups on Sunday at 2 AM..."
        ;;
    --remove)
        echo "Removing backup cron job..."
        crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
        echo "✅ Backup cron job removed."
        exit 0
        ;;
    "")
        echo "Setting up daily backups at 2 AM (default)..."
        ;;
    *)
        echo "Unknown option: $1"
        echo "Usage: $0 [--hourly|--daily|--weekly|--remove]"
        exit 1
        ;;
esac

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create log file if it doesn't exist
sudo touch "$CRON_LOG" 2>/dev/null
if [ ! -f "$CRON_LOG" ]; then
    CRON_LOG="$HOME/pos-backup.log"
    touch "$CRON_LOG"
fi

# Add cron job (avoid duplicates)
CRON_ENTRY="$SCHEDULE $BACKUP_SCRIPT >> $CRON_LOG 2>&1"

# Get current crontab, remove any existing backup job, add new one
(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "$CRON_ENTRY") | crontab -

echo ""
echo "✅ Backup cron job configured successfully!"
echo ""
echo "Schedule: $SCHEDULE"
echo "Script:   $BACKUP_SCRIPT"
echo "Log:      $CRON_LOG"
echo ""
echo "To verify, run: crontab -l"
echo "To view logs:   tail -f $CRON_LOG"
echo "To remove:      $0 --remove"
