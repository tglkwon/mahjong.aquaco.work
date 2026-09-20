#!/usr/bin/env bash
# ==============================================================================
# Setup Apache mod_evasive for IP Rate Limiting on Ubuntu EC2 (t3.micro)
# ==============================================================================
set -euo pipefail

echo "==> Checking privileges..."
if [[ $EUID -ne 0 ]]; then
    echo "[ERROR] This script must be run as root or with sudo." >&2
    exit 1
fi

echo "==> 1. Installing libapache2-mod-evasive..."
if ! dpkg -s libapache2-mod-evasive >/dev/null 2>&1; then
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libapache2-mod-evasive
    echo "[OK] libapache2-mod-evasive installed."
else
    echo "[OK] libapache2-mod-evasive is already installed."
fi

echo "==> 2. Setting up log and lock directories..."
LOG_DIR="/var/log/mod_evasive"
mkdir -p "${LOG_DIR}"
chown -R www-data:www-data "${LOG_DIR}"
chmod 750 "${LOG_DIR}"
echo "[OK] ${LOG_DIR} configured with www-data ownership."

echo "==> 3. Configuring /etc/apache2/mods-available/evasive.conf..."
cat <<'EOF' > /etc/apache2/mods-available/evasive.conf
<IfModule mod_evasive20.c>
    # Hash table size for IP tracking (prime number recommended)
    DOSHashTableSize    3097

    # Max requests for the same page per DOSPageInterval (1 sec)
    DOSPageCount        5
    DOSPageInterval     1

    # Max total requests across the entire site per DOSSiteInterval (1 sec)
    DOSSiteCount        50
    DOSSiteInterval     1

    # Blocking duration in seconds for offending IPs (receives 403 / 429)
    DOSBlockingPeriod   10

    # Directory where mod_evasive records blacklisted IP timestamps
    DOSLogDir           "/var/log/mod_evasive"

    # Whitelist localhost to prevent internal health checks from being blocked
    DOSWhitelist        127.0.0.1
    DOSWhitelist        ::1
</IfModule>
EOF
echo "[OK] evasive.conf updated."

echo "==> 4. Enabling evasive module..."
a2enmod evasive >/dev/null 2>&1 || true

echo "==> 5. Testing Apache configuration syntax..."
apache2ctl configtest

echo "==> 6. Reloading Apache service..."
systemctl reload apache2
echo "[SUCCESS] Apache mod_evasive is now active and protecting EC2."
