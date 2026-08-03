@echo off
setlocal

if "%~2"=="" (
  echo Uso:
  echo tests\run_ci001b2_e2e.cmd "C:\imagens\sangue.jpg" "C:\imagens\medula.jpg"
  exit /b 2
)

if "%CELLCOUNT_BASE_URL%"=="" set CELLCOUNT_BASE_URL=http://localhost:3000
if "%CELLCOUNT_API_TOKEN%"=="" set CELLCOUNT_API_TOKEN=cellcount_enterprise_2026_secure_ai_v4

node tests\ci001b2_e2e.mjs "%~1" "%~2" "reports\ci001b2_e2e_report.json"
exit /b %ERRORLEVEL%
