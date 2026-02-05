#!/bin/bash

# EcoTrip - Start both servers
echo " Starting EcoTrip..."
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend
node src/server.js &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend in background
echo " Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Both servers starting!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
