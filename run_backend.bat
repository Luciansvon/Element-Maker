@echo off
title Element Maker Backend Server
echo ===================================================
echo   Menyalakan Backend Server Element Maker (Port 8009)
echo ===================================================
cd /d %~dp0
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
    python -m uvicorn backend.main:app --host 127.0.0.1 --port 8009 --reload
) else (
    echo [ERROR] Lingkungan virtual .venv belum ditemukan.
    pause
)
