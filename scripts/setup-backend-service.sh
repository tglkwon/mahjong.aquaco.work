#!/bin/bash
set -euo pipefail

echo "=== [1/4] Setting up Mahjong API Systemd Service ==="
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$PROJECT_DIR/server"

SERVICE_FILE="/etc/systemd/system/mahjong-api.service"

cat <<EOF | sudo tee "$SERVICE_FILE" > /dev/null
[Unit]
Description=Mahjong Session Sync API Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$SERVER_DIR
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001

# Resource limits for t3.micro
MemoryMax=150M

[Install]
WantedBy=multi-user.target
EOF

echo "=== [2/4] Reloading systemd and enabling service ==="
sudo systemctl daemon-reload
sudo systemctl enable mahjong-api.service
sudo systemctl restart mahjong-api.service

echo "=== [3/4] Configuring Apache Reverse Proxy for /api ==="
# Enable proxy modules if not enabled
sudo a2enmod proxy proxy_http headers || true

APACHE_CONF="/etc/apache2/conf-available/mahjong-api-proxy.conf"
cat <<EOF | sudo tee "$APACHE_CONF" > /dev/null
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:3001/api
    ProxyPassReverse /api http://127.0.0.1:3001/api
</IfModule>
EOF

sudo a2enconf mahjong-api-proxy || true
sudo systemctl reload apache2 || true

echo "=== [4/4] Verifying Mahjong API Health ==="
sleep 1
curl -s http://127.0.0.1:3001/api/health || {
    echo "Service healthcheck failed"
    exit 1
}

echo "Mahjong API service successfully deployed and running on port 3001!"
