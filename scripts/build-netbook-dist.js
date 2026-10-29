import fs from 'fs';
import path from 'path';

const outDir = path.resolve(process.cwd(), 'netbook-dist');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Iniciar-Panel-Netbook.bat (Windows Launcher)
const batLauncher = `@echo off
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

:: Instalar dependencias si no estan presentes
if not exist node_modules (
  echo [!] Configurando primera ejecucion...
  call npm install --production --no-audit --no-fund
)

:: Iniciar servidor en segundo plano con bajo consumo de memoria (ideal Netbooks Intel Atom / Celeron)
start "NeshTV Server" /min node --max-old-space-size=256 server.mjs

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
`;

fs.writeFileSync(path.join(outDir, 'Iniciar-Panel-Netbook.bat'), batLauncher, 'utf8');

// 2. iniciar-panel-netbook.sh (Linux Launcher)
const shLauncher = `#!/bin/bash
echo "========================================================"
echo "      NESHTV - PANEL DE CONTROL PARA NETBOOK (LINUX)   "
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[!] Node.js no encontrado. Abriendo acceso web directo..."
    xdg-open Acceso-Directo-Panel-Cloud.html 2>/dev/null || sensible-browser Acceso-Directo-Panel-Cloud.html
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[!] Configurando dependencias para primera ejecucion..."
    npm install --production --no-audit --no-fund
fi

echo "Iniciando servidor local en segundo plano (optimizado para bajo consumo)..."
node --max-old-space-size=256 server.mjs &
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
`;

fs.writeFileSync(path.join(outDir, 'iniciar-panel-netbook.sh'), shLauncher, 'utf8');

// 3. Acceso-Directo-Panel-Cloud.html (Acceso directo HTML)
const htmlLauncher = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Acceso al Panel NeshTV</title>
  <style>
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background-color: #121215;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(0, 240, 255, 0.1);
      color: #00F0FF;
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 10px 0;
      color: #fff;
    }
    p {
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      box-sizing: border-box;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #00F0FF;
      color: #000;
    }
    .btn-primary:hover {
      background: #00c7d4;
    }
    .btn-secondary {
      background: #27272a;
      color: #e4e4e7;
    }
    .btn-secondary:hover {
      background: #3f3f46;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">NeshTV Suite Netbook</div>
    <h1>Panel de Administración</h1>
    <p>Selecciona cómo deseas abrir el Panel de Control en tu Netbook:</p>
    <a href="http://localhost:3000/" target="_blank" class="btn btn-primary">Abrir Servidor Local (http://localhost:3000)</a>
    <a href="https://294fb124-2a08-4c6b-8e46-47675f62507e.applets.cloud.google.com/" target="_blank" class="btn btn-secondary">Abrir Panel en la Nube (Cloud)</a>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outDir, 'Acceso-Directo-Panel-Cloud.html'), htmlLauncher, 'utf8');

// 4. INSTRUCCIONES-NETBOOK.txt
const instructions = `========================================================================
             NESHTV - INSTRUCCIONES DE USO EN NETBOOK / PC
========================================================================

¡Hola! Este paquete fue generado para que puedas usar el Panel Administrativo
y de Revendedor directamente en tu Netbook o Notebook con total fluidez.

Está optimizado especialmente para procesadores de bajo consumo (Intel Atom,
Celeron, AMD E-series) y 1GB, 2GB o 4GB de RAM.

------------------------------------------------------------------------
OPCION 1: EJECUTAR CON 1 CLIC (RECOMENDADA)
------------------------------------------------------------------------
1. Descomprime esta carpeta ZIP en tu Netbook (por ejemplo en el Escritorio).
2. Haz doble clic en "Iniciar-Panel-Netbook.bat".
3. Se abrirá automáticamente una ventana de escritorio independiente con el Panel:
   - Podrás crear y administrar usuarios.
   - Sincronizar y cargar listas M3U / Xtream Codes.
   - Bloquear canales, enviar mensajes flotantes y crear revendedores.

------------------------------------------------------------------------
OPCION 2: ACCESO DIRECTO HTML (SIN INSTALACIONES)
------------------------------------------------------------------------
1. Haz doble clic en "Acceso-Directo-Panel-Cloud.html".
2. Podrás acceder directamente al panel conectado a la base de datos en la nube.

------------------------------------------------------------------------
COMPATIBILIDAD
------------------------------------------------------------------------
- Windows 7, Windows 8, Windows 10, Windows 11 (32 bits y 64 bits).
- Linux (Ubuntu, Lubuntu, AntiX, Debian, Linux Mint).
- Consume menos de 80MB de memoria RAM para no ralentizar tu netbook.

¡Gracias por usar NeshTV!
========================================================================
`;

fs.writeFileSync(path.join(outDir, 'INSTRUCCIONES-NETBOOK.txt'), instructions, 'utf8');

// 5. Copiar dist/ si existe
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  fs.cpSync(distDir, path.join(outDir, 'dist'), { recursive: true });
}

// 6. Generar package.json minimo de produccion para netbook
const pkgJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
const minimalPkg = {
  name: 'neshtv-netbook-panel',
  version: '1.0.0',
  type: 'module',
  scripts: {
    start: 'node --max-old-space-size=256 server.mjs'
  },
  dependencies: {
    express: pkgJson.dependencies.express || '^4.21.2'
  }
};
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(minimalPkg, null, 2), 'utf8');

console.log('Archivos de distribución para Netbook generados exitosamente en netbook-dist/');
