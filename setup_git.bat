@echo off
echo Configurando Repositorio Git para Foton Automation...
git init
git add .
git commit -m "Initial commit: Foton Automation"
git branch -M main
git remote add origin https://github.com/fulviofb/equatorial-solar-automation.git
echo.
echo Tentando enviar para o GitHub...
git push -u origin main
echo.
echo Se houver erro de permissao, voce precisara se autenticar no navegador.
pause
