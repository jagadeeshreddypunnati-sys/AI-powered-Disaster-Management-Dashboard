@echo off
echo ========================================================
echo       Starting RESCUE AI Full Stack Platform
echo ========================================================

start cmd /k "cd backend && py -m uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm run dev"

echo Both servers starting!
echo Backend API:  http://localhost:8000/docs
echo Frontend App: http://localhost:3000
echo ========================================================
