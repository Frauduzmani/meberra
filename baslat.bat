@echo off
rem Meberra'yi yerelde baslatir: cift tikla, tarayici kendiliginden acilir.
title Meberra
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi. https://nodejs.org adresinden Node.js 24 LTS kurup tekrar deneyin.
  pause
  exit /b 1
)

if not exist "node_modules\web-push" (
  echo Ilk calistirma: paketler kuruluyor...
  call npm install --omit=dev
  if errorlevel 1 (
    echo [HATA] npm install basarisiz oldu.
    pause
    exit /b 1
  )
)

rem Port .env'de PORT= ile degistirildiyse onu kullan
set "PORT_NO=3000"
if exist ".env" (
  for /f "tokens=1,* delims==" %%a in ('findstr /b /c:"PORT=" ".env"') do set "PORT_NO=%%b"
)

echo.
echo Meberra baslatiliyor: http://localhost:%PORT_NO%
echo Durdurmak icin bu pencereyi kapatin ya da Ctrl+C basin.
echo.

rem Sunucu ayaga kalkinca tarayiciyi ac
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start "" http://localhost:%PORT_NO%"

node server/index.js
echo.
echo Sunucu durdu.
pause
