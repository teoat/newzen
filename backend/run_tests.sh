#!/bin/bash
# Zenith Platform Test Runner
# Executes all test suites and generates coverage report

set -e

echo "🧪 Zenith Platform - Test Suite Execution"
echo "=========================================="
echo ""

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest not found. Installing..."
    pip install pytest pytest-asyncio pytest-cov
fi

# Navigate to backend directory
cd "$(dirname "$0")"

echo "📦 Installing test dependencies..."
pip install -q pytest pytest-asyncio pytest-cov httpx

echo ""
echo "🔬 Running Unit Tests..."
echo "------------------------"
pytest tests/test_frenly_orchestrator.py -v --tb=short

echo ""
echo "🔗 Running Integration Tests..."
echo "--------------------------------"
pytest tests/test_ai_integration.py -v --tb=short

echo ""
echo "🌐 Running E2E Tests..."
echo "-----------------------"
pytest tests/test_e2e_flows.py -v --tb=short

echo ""
echo "📊 Running Authorization Tests..."
echo "----------------------------------"
pytest tests/test_authorization.py -v --tb=short

echo ""
echo "📈 Generating Coverage Report..."
echo "---------------------------------"
pytest tests/ --cov=app --cov-report=term-missing --cov-report=html

echo ""
echo "✅ All Tests Complete!"
echo ""
echo "📋 Coverage Report: htmlcov/index.html"
echo "🎯 Target: 80%+ coverage on critical paths"
echo ""
echo "Critical Modules Covered:"
echo "  ✓ app.modules.ai.frenly_orchestrator"
echo "  ✓ app.modules.ai.frenly_router"
echo "  ✓ app.core.auth_middleware"
echo "  ✓ app.core.rate_limit"
echo "  ✓ app.modules.project.router"
