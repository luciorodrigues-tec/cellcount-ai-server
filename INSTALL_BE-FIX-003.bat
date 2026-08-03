@echo off
setlocal

set PROJECT=C:\CELLCOUNT_V1.0.0-beta.4\backend
set BACKUP=%PROJECT%\_surgical_backups\BE-FIX-003

if not exist "%PROJECT%\server.js" (
  echo ERROR: backend project not found.
  exit /b 1
)

if not exist "%BACKUP%" mkdir "%BACKUP%"

for %%F in (
  ci002a_server_contract_test.mjs
  ci002b1_server_contract_test.mjs
  ci002c1_server_contract_test.mjs
  ci002d1_server_contract_test.mjs
) do (
  copy /Y "%PROJECT%\tests\%%F" "%BACKUP%\%%F" >nul
  copy /Y "%~dp0tests\%%F" "%PROJECT%\tests\%%F" >nul
)

cd /d "%PROJECT%"

node --check tests\ci002a_server_contract_test.mjs
if errorlevel 1 exit /b 1

node --check tests\ci002b1_server_contract_test.mjs
if errorlevel 1 exit /b 1

node --check tests\ci002c1_server_contract_test.mjs
if errorlevel 1 exit /b 1

node --check tests\ci002d1_server_contract_test.mjs
if errorlevel 1 exit /b 1

node --test ^
  tests\ci002a_server_contract_test.mjs ^
  tests\ci002b1_server_contract_test.mjs ^
  tests\ci002c1_server_contract_test.mjs ^
  tests\ci002d1_server_contract_test.mjs

endlocal
