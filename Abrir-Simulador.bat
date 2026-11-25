@echo off
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0"
title Abrir Pokemon Battle Simulator
set "NODE_ENV=development"

rem Porta padrao; uma porta inicial diferente pode ser passada como argumento.
set "PORT=3000"
if not "%~1"=="" set "PORT=%~1"

where node >nul 2>nul
if errorlevel 1 goto node_missing
where npm >nul 2>nul
if errorlevel 1 goto node_missing
where powershell >nul 2>nul
if errorlevel 1 goto tool_missing
where curl >nul 2>nul
if errorlevel 1 goto tool_missing

rem Se o simulador ja estiver aberto, reutiliza o servidor existente.
if "%PORT%"=="3000" (
    curl --fail --silent --max-time 2 http://127.0.0.1:3000/ 2>nul | findstr /C:"Simulador de Batalha" >nul
    if not errorlevel 1 goto open_existing
)

rem Reinstala quando o lockfile muda ou a instalacao esta incompleta.
set "LOCK_HASH="
for /f "usebackq delims=" %%H in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-FileHash -Algorithm SHA256 -LiteralPath 'package-lock.json').Hash"`) do set "LOCK_HASH=%%H"
if not defined LOCK_HASH goto hash_error

set "HASH_FILE=node_modules\.simulator-package-lock.sha256"
set "INSTALLED_HASH="
if exist "%HASH_FILE%" set /p INSTALLED_HASH=<"%HASH_FILE%"
if not exist "node_modules" goto install_dependencies
if /i not "%LOCK_HASH%"=="%INSTALLED_HASH%" goto install_dependencies
call npm ls --depth=0 --include=dev >nul 2>nul
if errorlevel 1 goto install_dependencies
if not exist "node_modules\.bin\tsx.cmd" goto install_dependencies
if not exist "node_modules\.bin\vite.cmd" goto install_dependencies
goto choose_port

:install_dependencies
echo Instalando ou atualizando dependencias. Aguarde...
call npm install --include=dev --no-audit --no-fund
if errorlevel 1 goto install_error
> "%HASH_FILE%" echo %LOCK_HASH%
call npm ls --depth=0 --include=dev >nul 2>nul
if errorlevel 1 goto dependencies_incomplete
if not exist "node_modules\.bin\tsx.cmd" goto dependencies_incomplete
if not exist "node_modules\.bin\vite.cmd" goto dependencies_incomplete

:choose_port
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if errorlevel 1 goto start_server
if %PORT% geq 3010 goto no_port
set /a PORT+=1
goto choose_port

:start_server
set "NODE_ENV=development"
echo Iniciando o simulador na porta %PORT%...
start "Servidor Pokemon - porta %PORT%" /D "%~dp0" cmd /k "npm run dev"

set /a ATTEMPTS=0
:wait_server
curl --fail --silent --max-time 2 "http://127.0.0.1:%PORT%/" >nul 2>nul
if not errorlevel 1 goto server_ready
set /a ATTEMPTS+=1
if %ATTEMPTS% geq 45 goto startup_error
timeout /t 1 /nobreak >nul
goto wait_server

:server_ready
echo Simulador disponivel em http://127.0.0.1:%PORT%/
if /i "%SIMULATOR_NO_BROWSER%"=="1" goto finished
start "" "http://127.0.0.1:%PORT%/"
goto finished

:open_existing
echo Reutilizando o simulador que ja estava aberto.
if /i not "%SIMULATOR_NO_BROWSER%"=="1" start "" "http://127.0.0.1:3000/"
exit /b 0

:finished
echo Para encerrar, feche a janela "Servidor Pokemon - porta %PORT%".
exit /b 0

:node_missing
echo Node.js/npm nao encontrado. Instale o Node.js e tente novamente.
goto fatal_error

:tool_missing
echo Ferramentas nativas do Windows nao encontradas: PowerShell ou curl.
goto fatal_error

:hash_error
echo Nao foi possivel conferir o package-lock.json.
goto fatal_error

:install_error
echo Falha ao instalar as dependencias. Veja os erros acima.
goto fatal_error

:dependencies_incomplete
echo A instalacao terminou sem tsx/Vite ou com dependencias ausentes.
echo Execute npm install --include=dev nesta pasta para diagnosticar o problema.
goto fatal_error

:no_port
echo Nenhuma porta livre encontrada no intervalo permitido.
goto fatal_error

:startup_error
echo O servidor nao respondeu no tempo esperado.
echo Consulte a janela "Servidor Pokemon - porta %PORT%" para ver o erro.

:fatal_error
pause
exit /b 1
