#!/bin/bash
set -e

echo "🔐 Generating self-signed SSL certificates for development..."

# Create SSL directory if it doesn't exist
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/cert.key \
  -out nginx/ssl/cert.crt \
  -subj "/C=US/ST=State/L=City/O=LexNova Legal/CN=localhost"

echo "✅ SSL certificates generated successfully!"
echo "📁 Location: nginx/ssl/"
echo "🔑 Key: nginx/ssl/cert.key"
echo "📜 Certificate: nginx/ssl/cert.crt"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   For production, use Let's Encrypt or a trusted CA."
