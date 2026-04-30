$ErrorActionPreference = "Stop"

$Ruta_Sistema = Split-Path -Parent $MyInvocation.MyCommand.Path
$Ruta_Venv = Join-Path $Ruta_Sistema ".venv"
$Python_Entorno = $env:SEMAPLAN_PYTHON

if (-not $Python_Entorno) {
    $Comando_Python = Get-Command python -ErrorAction SilentlyContinue

    if ($Comando_Python) {
        $Python_Entorno = $Comando_Python.Source
    }
}

if (-not $Python_Entorno) {
    throw "No se encontro Python. Defini SEMAPLAN_PYTHON."
}

& $Python_Entorno -m venv $Ruta_Venv

$Python_Venv = Join-Path $Ruta_Venv "Scripts\python.exe"
$Ruta_Requisitos = Join-Path $Ruta_Sistema "Requisitos_Tutoriales.txt"

& $Python_Venv -m pip install --upgrade pip
& $Python_Venv -m pip install -r $Ruta_Requisitos
& $Python_Venv -m playwright install chromium

Write-Host "Dependencias de tutoriales instaladas."
