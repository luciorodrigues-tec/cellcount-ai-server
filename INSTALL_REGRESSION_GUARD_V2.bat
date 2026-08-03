@echo off
setlocal
set PROJECT=C:\CELLCOUNT_V1.0.0-beta.4\backend

if not exist "%PROJECT%\server.js" (
  echo ERROR: server.js not found.
  exit /b 1
)

if not exist "%PROJECT%\_surgical_backups" (
  mkdir "%PROJECT%\_surgical_backups"
)

copy /Y "%PROJECT%\tests\cck0011_regression_test.mjs" ^
  "%PROJECT%\_surgical_backups\cck0011_regression_test_before_v2.mjs" >nul

copy /Y "%PROJECT%\kernel\core\tests\cck0011_regression_test.mjs" ^
  "%PROJECT%\_surgical_backups\cck0011_kernel_regression_test_before_v2.mjs" >nul

copy /Y "%~dp0tests\cck0011_regression_test.mjs" ^
  "%PROJECT%\tests\cck0011_regression_test.mjs" >nul

copy /Y "%~dp0kernel\core\tests\cck0011_regression_test.mjs" ^
  "%PROJECT%\kernel\core\tests\cck0011_regression_test.mjs" >nul

cd /d "%PROJECT%"

node --check tests\cck0011_regression_test.mjs
if errorlevel 1 exit /b 1

node --check kernel\core\tests\cck0011_regression_test.mjs
if errorlevel 1 exit /b 1

echo Regression Guard v2 installed successfully.
echo.
echo Next:
echo set UPDATE_REGRESSION_GUARD=1
echo node --test tests\cck0011_regression_test.mjs
echo set UPDATE_REGRESSION_GUARD=

endlocal
