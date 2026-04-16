@echo off
title Encuesta VECATSOF
cls
echo.
echo  ========================================
echo   Iniciando servidor de la encuesta...
echo  ========================================
echo.

:: Inicia el servidor en segundo plano
start "" /B node "%~dp0server.js"

:: Espera 2 segundos a que el servidor arranque
timeout /t 2 /nobreak >nul

:: Abre la pagina en el navegador predeterminado
start "" "http://localhost:3000"

echo  Servidor activo en http://localhost:3000
echo  Cierra esta ventana para detener el servidor.
echo.

:: Mantiene el servidor vivo mientras la ventana este abierta
node "%~dp0server.js"
