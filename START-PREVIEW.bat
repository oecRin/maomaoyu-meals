@echo off
setlocal
cd /d "%~dp0"
echo Open http://127.0.0.1:8000 in your browser.
echo Keep this window open. Press Ctrl+C to stop.
echo.
py -3 --version >nul 2>&1
if not errorlevel 1 (
  py -3 -m http.server 8000 --bind 127.0.0.1 --directory dist
  goto finished
)
python --version >nul 2>&1
if not errorlevel 1 (
  python -m http.server 8000 --bind 127.0.0.1 --directory dist
  goto finished
)
echo Python 3 was not found. See README for other preview options.
:finished
pause
endlocal
