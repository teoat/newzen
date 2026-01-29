#!/bin/bash
# Phase 4 Integration - Dependency Installation Script
# Run this script to install all required dependencies for Phase 4 features

set -e  # Exit on error

echo "🚀 Phase 4 Integration - Installing Dependencies"
echo "==============================================="
echo ""

# Navigate to backend
cd "$(dirname "$0")/../backend"

echo "📦 Installing Python dependencies..."
echo ""

# Install sentence transformers for semantic matching
echo "  ✓ Installing sentence-transformers (NLP)..."
pip install -q sentence-transformers

# Install scikit-learn for machine learning utilities
echo "  ✓ Installing scikit-learn..."
pip install -q scikit-learn

# Install ReportLab for PDF generation
echo "  ✓ Installing reportlab (PDF generation)..."
pip install -q reportlab

# Install QR code generation
echo "  ✓ Installing qrcode..."
pip install -q qrcode

# Install Pillow for image processing
echo "  ✓ Installing pillow..."
pip install -q pillow

# Requests should already be installed, but ensure it's there
echo "  ✓ Ensuring requests is installed..."
pip install -q requests

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📋 Installed packages:"
echo "  - sentence-transformers (for semantic matching)"
echo "  - scikit-learn (ML utilities)"
echo "  - reportlab (PDF generation)"
echo "  - qrcode (QR codes for dossiers)"
echo "  - pillow (image processing)"
echo "  - requests (exchange rate API)"
echo ""
echo "🎯 Next Steps:"
echo "  1. (Optional) Add exchange rate API key to .env:"
echo "     EXCHANGE_RATE_API_KEY=your_key_here"
echo ""
echo "  2. Start the backend server:"
echo "     cd backend && uvicorn app.main:app --reload --port 8200"
echo ""
echo "  3. Test the new endpoints:"
echo "     curl http://localhost:8200/health/detailed"
echo "     curl http://localhost:8200/api/v1/currency/supported"
echo ""
echo "✨ Phase 4 integration complete! Ready to use all new features."
