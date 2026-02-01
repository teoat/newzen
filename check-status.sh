#!/bin/bash
# Comprehensive Implementation Status Check

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         🔍 IMPLEMENTATION STATUS CHECK 🔍                         ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Check 1: Backend Dependencies
echo "📦 Backend Dependencies:"
cd /Users/Arief/Newzen/zenith-lite/backend
source venv/bin/activate 2>/dev/null
pip list 2>/dev/null | grep -E "networkx|louvain|googlemaps|aiohttp|pyotp|qrcode|pact" | head -8
echo ""

# Check 2: Frontend Dependencies  
echo "📦 Frontend Dependencies:"
cd /Users/Arief/Newzen/zenith-lite/frontend
npm list --depth=0 2>/dev/null | grep -E "react-window"
echo ""

# Check 3: Backend Status
echo "🔌 Backend Server Status:"
curl -s http://localhost:8200/docs >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend running on port 8200"
    echo "   OpenAPI docs: http://localhost:8200/docs"
else
    echo "⚠️  Backend not responding on port 8200"
fi
echo ""

# Check 4: Frontend Status
echo "🌐 Frontend Server Status:"
curl -s http://localhost:3200 >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend running on port 3200"
    echo "   App URL: http://localhost:3200"
else
    echo "⚠️  Frontend not responding on port 3200"
fi
echo ""

# Check 5: Redis Status
echo "🗄️  Redis Cache Status:"
redis-cli ping >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis is not running (optional service)"
fi
echo ""

# Check 6: Created Files
echo "📁 New Services Created:"
cd /Users/Arief/Newzen/zenith-lite
[ -f "backend/app/api/v1/endpoints/cache.py" ] && echo "✅ backend/app/api/v1/endpoints/cache.py"
[ -f "backend/app/core/cache.py" ] && echo "✅ backend/app/core/cache.py"
[ -f "backend/app/core/mfa.py" ] && echo "✅ backend/app/core/mfa.py"
[ -f "backend/app/modules/forensic/network_service.py" ] && echo "✅ backend/app/modules/forensic/network_service.py"
[ -f "frontend/src/components/ForensicChronology/VirtualizedTimeline.tsx" ] && echo "✅ VirtualizedTimeline.tsx"
[ -f "frontend/src/components/ForensicChronology/EventDetailModal.tsx" ] && echo "✅ EventDetailModal.tsx"
echo ""

# Check 7: Documentation
echo "📚 Documentation Created:"
[ -f "MASTER_ROADMAP_TO_100.md" ] && echo "✅ MASTER_ROADMAP_TO_100.md"
[ -f "FINAL_COMPLETION_CHECKLIST.md" ] && echo "✅ FINAL_COMPLETION_CHECKLIST.md"
[ -f "ARCHITECTURE.md" ] && echo "✅ ARCHITECTURE.md"
[ -f "SESSION_COMPLETION_REPORT.md" ] && echo "✅ SESSION_COMPLETION_REPORT.md"
echo ""

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ STATUS CHECK COMPLETE                      ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
