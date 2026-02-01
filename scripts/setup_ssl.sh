#!/bin/bash

# SSL Certificate Generation Script
# Creates self-signed certificates for development/testing
# For production, use certificates from a trusted CA

set -e

SSL_DIR="ssl"
CERT_FILE="$SSL_DIR/zenith.crt"
KEY_FILE="$SSL_DIR/zenith.key"
CSR_FILE="$SSL_DIR/zenith.csr"
CONFIG_FILE="$SSL_DIR/zenith.conf"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create SSL directory
mkdir -p "$SSL_DIR"
cd "$(dirname "$0")/.."  # Go to project root
SSL_DIR="$(pwd)/ssl"

# Check if certificates already exist
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    warning "SSL certificates already exist!"
    echo "Choose an option:"
    echo "1) Keep existing certificates"
    echo "2) Regenerate certificates"
    echo "3) Force regenerate (no prompt)"
    
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            success "Keeping existing certificates"
            exit 0
            ;;
        3)
            rm -f "$CERT_FILE" "$KEY_FILE" "$CSR_FILE" "$CONFIG_FILE"
            ;;
        2)
            rm -f "$CERT_FILE" "$KEY_FILE" "$CSR_FILE" "$CONFIG_FILE"
            ;;
        *)
            error "Invalid choice"
            exit 1
            ;;
    esac
fi

# Generate certificate configuration
log "Creating SSL certificate configuration..."
cat > "$CONFIG_FILE" << EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = California
L = San Francisco
O = Zenith Financial Intelligence
OU = IT Department
CN = localhost
emailAddress = admin@zenith.local

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = zenith.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

success "SSL configuration created: $CONFIG_FILE"

# Generate private key
log "Generating private key..."
openssl genrsa -out "$KEY_FILE" 2048
success "Private key generated: $KEY_FILE"

# Generate certificate signing request
log "Generating certificate signing request..."
openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" -config "$CONFIG_FILE"
success "CSR generated: $CSR_FILE"

# Generate self-signed certificate
log "Generating self-signed SSL certificate..."
openssl x509 -req -days 365 -in "$CSR_FILE" -signkey "$KEY_FILE" -out "$CERT_FILE" -extensions v3_req -extfile "$CONFIG_FILE"
success "SSL certificate generated: $CERT_FILE"

# Set appropriate permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

# Display certificate information
log "Certificate information:"
openssl x509 -in "$CERT_FILE" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:|IP Address:)" || true

# Cleanup
rm -f "$CSR_FILE"

# Create production SSL guide
cat > "../PRODUCTION_SSL_GUIDE.md" << EOF
# 🛡️ PRODUCTION SSL SETUP GUIDE

## 🔐 SELF-SIGNED CERTIFICATES (Development Only)

The generated certificates in \`ssl/\` directory are self-signed and suitable for:
- Development environments
- Testing SSL functionality
- Internal network deployments

## 🚀 PRODUCTION SSL SETUP

For production deployment, use certificates from a trusted Certificate Authority:

### Option 1: Let's Encrypt (Free)
\`\`\`bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
\`\`\`

### Option 2: Commercial CA
1. Purchase SSL certificate from provider (DigiCert, GlobalSign, etc.)
2. Generate CSR with your actual domain
3. Submit CSR to CA
4. Install received certificates in \`ssl/\` directory

### Option 3: Cloud Provider SSL
- AWS ACM (Certificate Manager)
- Google Cloud SSL
- Azure Key Vault

## 🔧 CONFIGURATION

### Nginx SSL Configuration
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/zenith.crt;
    ssl_certificate_key /etc/ssl/certs/zenith.key;
    
    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
}
\`\`\`

### Docker SSL Setup
\`\`\`bash
# Use SSL-enabled compose file
docker compose -f docker-compose.ssl.yml up -d

# Or with Nginx proxy
docker compose -f docker-compose.ssl.yml --profile ssl-proxy up -d
\`\`\`

## ⚠️ IMPORTANT NOTES

1. **Self-signed certificates will show browser warnings** in production
2. **Update domain names** in \`zenith.conf\` before generating production CSR
3. **Secure private keys** with appropriate permissions (600)
4. **Regular renewal** required for Let's Encrypt certificates (90 days)
5. **Backup certificates** securely in version control (but NOT private keys)

## 🚀 AUTOMATIC CERTIFICATE RENEWAL

### Let's Encrypt Auto-renewal
\`\`\`bash
# Test renewal
sudo certbot renew --dry-run

# Set up cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
\`\`\`

### Monitoring
- Set up alerts for certificate expiry (30 days before)
- Monitor SSL certificate validity
- Test SSL configuration regularly

---

*Generated on: $(date)*
*Certificate valid until: $(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)*
EOF

success "Production SSL guide created: PRODUCTION_SSL_GUIDE.md"

echo
log "SSL Setup Summary:"
echo "  📁 Certificate: $CERT_FILE"
echo "  🔐 Private Key: $KEY_FILE"
echo "  ⚙️  Configuration: $CONFIG_FILE"
echo "  📖 SSL Guide: ../PRODUCTION_SSL_GUIDE.md"
echo
success "SSL certificate setup complete!"
echo
echo "🚀 Next steps:"
echo "   1. Start with SSL: docker compose -f docker-compose.ssl.yml up -d"
echo "   2. Test HTTPS: https://localhost:8443"
echo "   3. Read production guide: PRODUCTION_SSL_GUIDE.md"
echo
warning "Note: Browsers will show warnings for self-signed certificates"