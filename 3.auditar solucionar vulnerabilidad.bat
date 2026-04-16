@echo off
cd /d "%~dp0"
echo Ejecutando instalacion y servidor desde archivos separados...
call instalar.bat
call ejecutar.bat