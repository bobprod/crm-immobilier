@echo off
setlocal enabledelayedexpansion

set JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWk1N3ljdWUwMDAwdzN2dW5vcGVkdXY2IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkFHRU5UIiwiaWF0IjoxNzY3ODA5Mzk1LCJleHAiOjE3Njc4MTI5OTV9.ugmzwIG2-N4LXCkJkjcRHUooTvrsX7o_0lq5gpRaxbA

echo Lancement de la prospection...
curl -X POST http://localhost:3001/api/prospecting-ai/start ^
  -H "Authorization: Bearer !JWT!" ^
  -H "Content-Type: application/json" ^
  -d "{\"zone\":\"Paris 15\",\"targetType\":\"VENDEURS\",\"propertyType\":\"APPARTEMENT\",\"maxLeads\":5}"

timeout /t 5
