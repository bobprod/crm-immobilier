#!/bin/bash
cd "backend"
npm start &
SERVER_PID=$!
sleep 10

cd ../
node test-prospection-simple.js

# Print last 50 lines of logs
sleep 2
kill $SERVER_PID 2>/dev/null || true
