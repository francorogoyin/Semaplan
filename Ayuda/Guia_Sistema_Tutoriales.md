# Guia del sistema de tutoriales.

El sistema propio de ayuda vive dentro de `Ayuda` y separa tres cosas:
contratos de tutoriales, videos generados y motor de produccion.

## Estructura.

- `Ayuda/Tutoriales_En_Texto`: contratos JSON y tutoriales escritos.
- `Ayuda/Videos/Crudos`: grabaciones originales del navegador.
- `Ayuda/Videos/Renderizados`: videos MP4 listos para publicar.
- `Ayuda/Videos/Overlays`: carteles generados como imagenes.
- `Ayuda/Videos/Audio`: narraciones generadas por voz IA.
- `Ayuda/Videos/Datos`: eventos, capturas y datos intermedios.
- `Ayuda/Sistema_Tutoriales`: scripts del pipeline.

## Instalacion.

El repo no asume Python ni FFmpeg global. La instalacion local crea
un entorno aislado dentro de `Ayuda/Sistema_Tutoriales/.venv`.

```powershell
powershell -ExecutionPolicy Bypass -File `
  Ayuda\Sistema_Tutoriales\Instalar_Dependencias.ps1
```

Si Python no esta en el PATH, definir antes la ruta manual.

```powershell
$env:SEMAPLAN_PYTHON = "C:\Ruta\A\python.exe"
```

## Uso.

Generar tutorial escrito.

```powershell
Ayuda\Sistema_Tutoriales\Ejecutar_Tutorial.ps1 texto `
  Ayuda\Tutoriales_En_Texto\Plantilla_Tutorial.json
```

Grabar el navegador.

```powershell
Ayuda\Sistema_Tutoriales\Ejecutar_Tutorial.ps1 capturar `
  Ayuda\Tutoriales_En_Texto\Plantilla_Tutorial.json
```

Generar voz con ElevenLabs.

```powershell
$env:ELEVENLABS_API_KEY = "clave"
$env:ELEVENLABS_VOICE_ID = "voz"
Ayuda\Sistema_Tutoriales\Ejecutar_Tutorial.ps1 voz `
  Ayuda\Tutoriales_En_Texto\Plantilla_Tutorial.json
```

Renderizar video final.

```powershell
Ayuda\Sistema_Tutoriales\Ejecutar_Tutorial.ps1 renderizar `
  Ayuda\Tutoriales_En_Texto\Plantilla_Tutorial.json
```

Ejecutar todo el pipeline.

```powershell
Ayuda\Sistema_Tutoriales\Ejecutar_Tutorial.ps1 todo `
  Ayuda\Tutoriales_En_Texto\Plantilla_Tutorial.json
```

## Contrato de tutorial.

Cada tutorial se declara en JSON con estos campos principales.

- `Identificador`: nombre estable para archivos de salida.
- `Titulo`: titulo editorial del tutorial.
- `Descripcion_Corta`: resumen de la pieza.
- `Resolucion`: ancho y alto del video.
- `Storage_State`: sesion guardada de Playwright, si hace falta.
- `Pasos_Texto`: pasos para la ayuda escrita.
- `Narracion`: texto que puede convertirse en voz IA.
- `Carteles`: overlays con inicio, fin, texto y posicion.
- `Acciones`: pasos reproducibles para Playwright.
- `Youtube`: titulo, descripcion y etiquetas para publicacion.

Las acciones soportadas son `Ir_A`, `Click`, `Rellenar`, `Presionar`,
`Esperar`, `Esperar_Selector`, `Hover`, `Scroll`, `Evaluar`,
`Captura` y `Pausa_Manual`.

`Pausa_Manual` sirve para casos donde conviene intervenir durante la
grabacion, por ejemplo iniciar sesion o preparar datos visibles antes
de seguir con acciones automaticas.

## Regla editorial.

Conviene producir videos de 60 a 180 segundos. Cada video debe cubrir
una funcion real, no una recorrida general larga. Si una funcion tiene
muchas variantes, se parte en una pieza base y una pieza avanzada.
