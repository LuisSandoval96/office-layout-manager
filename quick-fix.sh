#!/bin/bash
echo "Subiendo cambios críticos..."
git add .
git commit -m "CRITICAL FIX: Change submit button to onClick to fix assignment issue"
git push
echo "Cambios subidos - aplicación se actualizará en 1-2 minutos"
