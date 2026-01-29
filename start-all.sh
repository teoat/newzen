#!/bin/bash
echo "🚀 Starting Zenith Lite (Custom Ports)..."

# Ports
FRONTEND_PORT=3200
BACKEND_PORT=8200

# NextAuth Config
export NEXTAUTH_URL=http://localhost:3200
export NEXTAUTH_SECRET=7b9d8e7c6b5a4d3c2b1a0f9e8d7c6b5a4d3c2b1a0f9e8d7c6b5
export NEXT_PUBLIC_API_URL=http://localhost:8200

# Start DB in Docker (Background)
echo "📦 Starting Database (Port 5442)..."
docker-compose -f zenith-lite/docker-compose.yml up -d db

# Start Backend (Background)
echo "🧠 Starting Backend (Port $BACKEND_PORT)..."
source zenith-lite/backend/venv/bin/activate
# Run in background, log to file
cd zenith-lite/backend
nohup uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > backend.log 2>&1 &
BACKEND_PID=$!
cd ../..
echo "✅ Backend running (PID: $BACKEND_PID)"

# Start Frontend (Foreground)
echo "🎨 Starting Frontend (Port $FRONTEND_PORT)..."
cd zenith-lite/frontend
# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Frontend Dependencies..."
    npm install
fi

echo "✨ Zenith Lite is ready! Opening browser..."
# Wait a sec for dev server to start
sleep 3
open http://localhost:$FRONTEND_PORT &

# Pass port to Next.js
npm run dev -- -p $FRONTEND_PORT
