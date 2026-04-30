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
- `Ayuda/Videos/Subtitulos`: subtitulos SRT accesibles.
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
- `Acciones_Preparacion`: acciones previas que no se graban.
- `Acciones`: pasos reproducibles para Playwright.
- `Youtube`: titulo, descripcion y etiquetas para publicacion.

Las acciones soportadas son `Ir_A`, `Click`, `Rellenar`,
`Seleccionar`, `Presionar`, `Esperar`, `Esperar_Selector`,
`Esperar_Funcion`, `Hover`, `Scroll`, `Evaluar`, `Captura` y
`Pausa_Manual`.

`Pausa_Manual` sirve para casos donde conviene intervenir durante la
grabacion, por ejemplo iniciar sesion o preparar datos visibles antes
de seguir con acciones automaticas.

Para scripts largos de `Evaluar` o `Esperar_Funcion`, usar
`Codigo_Lineas` en lugar de una cadena unica. El motor une esas lineas
antes de pasarlas a Playwright.

## Accesibilidad.

La fuente textual principal del video son los carteles y toasts
temporizados. Ese mismo texto se usa para la voz y para el archivo
`.srt`, de modo que una persona sorda pueda leer todo lo que se dice
y una persona que escucha reciba exactamente lo que aparece en pantalla.
El motor recorta automáticamente los rangos de carteles consecutivos
para que nunca se superpongan en el video.

Los textos visibles deben escribirse en español completo, con tildes,
signos y puntuación correctos. Si un contrato viejo no tiene tildes,
el motor aplica una corrección conservadora antes de generar voz,
toasts, subtítulos y texto de ayuda. No se debe entregar un video donde
la voz lea mal palabras como `baúl`, `búsqueda`, `cajón`, `hábito`,
`qué`, `cómo`, `médico`, `período` o `próximo`.

Cada acción relevante debe tener un cartel breve, escrito desde la
duda del usuario. Primero se explica qué se va a hacer, después el
mouse visible se mueve hacia el control y recién ahí se ejecuta la
acción.

Si no hay clave de ElevenLabs, los contratos pueden usar
`"Proveedor": "Windows"` dentro de `Voz` para generar una narracion
local de borrador. Para ralentizar la voz de forma confiable, usar
`"Tempo": 0.75` o un valor similar menor que `1`; el motor ajusta
el audio con FFmpeg. La voz local se genera por segmentos: cada
cartel crea su propio WAV y luego el motor lo coloca en el mismo
segundo en que aparece el toast. Si una frase no entra en la ventana
del cartel, el segmento se ajusta solo lo necesario para evitar
solapes con el texto siguiente. La pista final se valida para evitar
archivos silenciosos.

## Control de calidad editorial.

Antes de dar por listo un video, revisar estas reglas.

- La introducción dice qué se va a recorrer, para qué sirve la sección
  y qué dudas resuelve.
- La voz va lenta y alineada con el cartel visible y con el movimiento
  del mouse.
- Todo lo que dice la voz aparece también como texto en pantalla y en
  subtítulos.
- No aparece la palabra `Paso` en los toasts, ni carteles con fuente
  excesiva, ni carteles superpuestos.
- El mouse se ve durante clicks, hovers y rellenos importantes.
- Las palabras salen con tildes reales en voz, cartel, `.srt` y
  tutorial escrito.
- Si el flujo natural crea, edita o marca algo, se guarda. No se dice
  que se evita modificar una cuenta de prueba.
- No se mencionan detalles internos del pipeline, cuentas de prueba,
  Playwright ni excusas técnicas dentro del video.
- Los ejemplos deben parecer datos de una persona usuaria normal:
  nombres claros, fechas, emojis, categorías, etiquetas, notas o
  fotos cuando la función lo justifique.
- La preparación previa debe cargar esos ejemplos antes de grabar y
  debe poder repetirse sin acumular basura.

## Datos de ejemplo.

Antes de grabar una seccion, el contrato debe preparar datos
realistas con `Acciones_Preparacion`. La pantalla no debe mostrar
restos tecnicos, nombres de diagnostico ni datos vacios que una
persona normal no usaria.

La preparacion debe ser idempotente: puede borrar o reemplazar solo
los ejemplos creados para ese tutorial, y despues debe guardar el
estado. Si el flujo natural del tutorial termina creando algo, se
guarda. No se mencionan cuentas de prueba ni excusas internas en la
voz, los toasts ni el texto de ayuda.

## Regla editorial.

Conviene producir videos de 3 a 8 minutos para secciones grandes y
de 60 a 180 segundos para funciones puntuales. Cada video debe abrir
con una introduccion clara: que seccion se recorre, para que sirve,
que duda resuelve y que acciones se van a mostrar.

El ritmo debe ser deliberado. No alcanza con abrir una seccion: hay
que recorrer sus zonas principales, mostrar controles, explicar cuando
usarlos y anticipar el efecto de cada click.
