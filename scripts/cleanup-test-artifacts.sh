#!/bin/bash
set -euo pipefail

echo "======================================================"
echo " Mahjong Live Session Test Artifacts Cleanup Script   "
echo "======================================================"
echo "Note: The primary production database (mahjong.db)     "
echo "      will NEVER be deleted by this script.           "
echo "======================================================"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. Clean test databases while preserving production mahjong.db
echo "-> Cleaning test databases in server/data/..."
if [ -d "$PROJECT_DIR/server/data" ]; then
    find "$PROJECT_DIR/server/data" -name "test_*.db*" -type f -exec rm -v {} + || true
    echo "   Test databases removed. mahjong.db is safely preserved."
fi

# 2. Clean temporary node test cache and coverage if any
echo "-> Cleaning temporary test coverage and debug logs..."
rm -rf "$PROJECT_DIR/coverage" || true
rm -rf "$PROJECT_DIR/.nyc_output" || true
find "$PROJECT_DIR" -name "*.log" -not -path "*/.git/*" -not -path "*/node_modules/*" -type f -delete || true

# 3. Clean legacy backup directory if present
if [ -d "$PROJECT_DIR/_legacy_backup_2026" ]; then
    echo "-> Removing isolated legacy backup (_legacy_backup_2026)..."
    rm -rf "$PROJECT_DIR/_legacy_backup_2026"
    echo "   Legacy backup directory cleaned."
fi

echo "======================================================"
echo "Cleanup completed successfully!"
echo "Production state summary:"
ls -lh "$PROJECT_DIR/server/data/" || true
echo "======================================================"
