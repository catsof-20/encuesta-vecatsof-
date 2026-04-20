@echo off
title Servidor Encuesta Vecatsof
cls
echo.
echo  ==============================================
echo     REINICIANDO SERVIDOR DE LA ENCUESTA
echo  ==============================================
echo.

:: Intenta cerrar cualquier instancia previa para liberar el puerto 3000
taskkill /F /IM node.exe /T >nul 2>&1

echo [1/3] Iniciando proceso Node.js...
:: Arranca el servidor en segundo plano pero canalizando la salida a esta ventana
start /B node "%~dp0server.js"

echo [2/3] Esperando a que el servidor este listo...
timeout /t 5 /nobreak >nul

echo [3/3] Abriendo navegador predeterminado...
start "" "http://localhost:3000"

echo.
echo  ================================================
echo   ESTADO: ACTIVO en http://localhost:3000
echo   NOTA: Mantén esta ventana abierta.
echo   Si ves errores arriba, por favor dímelo.
echo  ================================================
echo.
echo  Presiona cualquier tecla para detener el servidor...
pause >nul

:: Al presionar una tecla, matamos el proceso para que el puerto quede libre
taskkill /F /IM node.exe /T >nul 2>&1
exit
