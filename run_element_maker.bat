@echo off
title Element Maker Desktop
echo ===================================================
echo     Membuka Aplikasi Desktop Element Maker Studio
echo ===================================================
cd /d %~dp0
if exist "src-tauri\target\release\Element-Maker.exe" (
    start "" "src-tauri\target\release\Element-Maker.exe"
) else (
    echo [ERROR] Biner desktop Element-Maker.exe belum dikompilasi.
    pause
)
