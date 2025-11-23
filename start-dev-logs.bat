@echo off
start powershell -NoExit -Command "cd \"C:\stellar-workshop\Proyecto\HumanPc\humanProject\"; Write-Host \"=== FRONTEND (Vite) ===\"  -ForegroundColor Cyan; npm run dev"
timeout /t 2 /nobreak > nul
start powershell -NoExit -Command "cd \"C:\stellar-workshop\Proyecto\HumanPc\humanProject\backend\"; Write-Host \"=== BACKEND (Express) ===\" -ForegroundColor Green; npm run dev"
