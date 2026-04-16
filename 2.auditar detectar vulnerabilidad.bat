@echo off
cd /d "%~dp0"
echo Iniciando servidor de la encuesta...
start http://localhost:3000
callnode server.js
pause
