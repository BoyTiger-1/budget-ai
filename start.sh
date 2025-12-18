#!/bin/bash

echo "💰 Budget AI - Starting Application"
echo "===================================="
echo ""

# Start backend in background
echo "Starting Flask backend server..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting React frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev

# Kill backend when frontend stops
kill $BACKEND_PID 2>/dev/null

