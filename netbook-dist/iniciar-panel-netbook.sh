#!/bin/bash
echo "========================================================"
echo "      NESHTV - PANEL DE CONTROL PARA NETBOOK (LINUX)   "
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[!] Node.js no encontrado. Abriendo acceso web directo..."
    xdg-open Acceso-Directo-Panel-Cloud.html 2>/dev/null || sensible-browser Acceso-Directo-Panel-Cloud.html
    exit 1
fi

echo "Iniciando servidor local en segundo plano (optimizado para bajo consumo)..."
node --max-old-space-size=256 server.cjs &
SERVER_PID=$!

sleep 2

echo "Abriendo panel en tu navegador..."
if command -v google-chrome &> /dev/null; then
    google-chrome --app=http://localhost:3000/ --window-size=1200,750 &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --app=http://localhost:3000/ --window-size=1200,750 &
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000/ &
else
    sensible-browser http://localhost:3000/ &
fi

echo "Servidor ejecutandose con PID $SERVER_PID. Presiona Ctrl+C para detener."
wait $SERVER_PID
