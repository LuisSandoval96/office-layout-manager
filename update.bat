@echo off
echo Subiendo cambios de debug...
git add .
git commit -m "Add detailed debug logs for assignment button issue"
git push
echo Cambios subidos. La aplicacion se actualizara en 1-2 minutos.
pause
