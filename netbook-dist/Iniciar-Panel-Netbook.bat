@echo off
title NeshTV - Panel Administrativo Netbook
color 0b
echo ========================================================
echo       NESHTV - PANEL DE CONTROL PARA NETBOOK
echo ========================================================
echo.
echo Iniciando el servidor local del panel con consumo optimizado...
echo.

:: Verificar si node esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [!] Node.js no se detecto en el sistema.
  echo [!] Abriendo el acceso directo al panel en la nube / navegador...
  timeout /t 2 >nul
  start "" "Acceso-Directo-Panel-Cloud.html"
  exit /b
)

:: Iniciar servidor en segundo plano con bajo consumo de memoria (ideal Netbooks Intel Atom / Celeron)
start "NeshTV Server" /min node --max-old-space-size=256 server.cjs

:: Esperar 2 segundos a que el servidor inicialice
timeout /t 2 /nobreak >nul

:: Abrir en modo aplicacion de escritorio nativa (sin barras de navegador)
echo Abriendo ventana del Panel Administrativo...
where msedge >nul 2>nul
if %errorlevel% equ 0 (
  start msedge --app=http://localhost:3000/ --window-size=1200,750
  goto final
)

where chrome >nul 2>nul
if %errorlevel% equ 0 (
  start chrome --app=http://localhost:3000/ --window-size=1200,750
  goto final
)

start http://localhost:3000/

:final
echo.
echo ========================================================
echo  Panel iniciado correctamente en http://localhost:3000/
echo  Para cerrar el panel, cierra la ventana de la aplicacion
echo ========================================================
exit
