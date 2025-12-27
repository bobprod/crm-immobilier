#!/bin/bash

echo "Starting Backend Server..."
cd backend
npm run start:dev &
BACKEND_PID=$!

echo "Starting Frontend Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

echo "Waiting for servers to start (15 seconds)..."
sleep 15

echo "Running Playwright tests..."
cd ../frontend
npx playwright test delete-property-confirmation.spec.ts --project=chromium

echo "Tests completed. Press Ctrl+C to stop servers."
wait
