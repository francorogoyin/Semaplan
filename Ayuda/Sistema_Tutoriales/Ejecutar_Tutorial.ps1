$ErrorActionPreference = "Stop"

$Ruta_Sistema = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python_Venv = Join-Path $Ruta_Sistema ".venv\Scripts\python.exe"
$Ruta_Script = Join-Path $Ruta_Sistema "Generar_Tutorial.py"

if (Test-Path $Python_Venv) {
    & $Python_Venv $Ruta_Script @args
    exit $LASTEXITCODE
}

$Python_Entorno = $env:SEMAPLAN_PYTHON

if (-not $Python_Entorno) {
    $Comando_Python = Get-Command python -ErrorAction SilentlyContinue

    if ($Comando_Python) {
        $Python_Entorno = $Comando_Python.Source
    }
}

if (-not $Python_Entorno) {
    throw "No se encontro Python. Ejecuta Instalar_Dependencias.ps1."
}

& $Python_Entorno $Ruta_Script @args
exit $LASTEXITCODE
