# Auditoria mobile Semaplan

Fecha local: 2026-04-14
Entorno: `https://semaplan.com`
Viewport: `Pixel 7` (`412x839`)
Herramienta: Playwright

## Conclusion ejecutiva

Semaplan hoy no esta lista para una app Android empaquetada.

No por responsive bruto: en las vistas probadas no hubo overflow
horizontal fuerte y login / overlays entran razonablemente en
pantalla.

El bloqueo real es de interaccion:

1. El flujo central para crear bloques depende de `dragstart/drop`
   de desktop.
2. Los accesos superiores de navegacion quedan tapados por el
   header del calendario.
3. Siguen vivos varios patrones desktop-only:
   `dblclick`, `contextmenu`, `mouseenter`, `mousedown`,
   resize por mouse y hover prolongado.

Si empaquetamos esto hoy con Capacitor, el APK se puede generar,
pero la experiencia principal quedaria rota o confusa.

## Hallazgos prioritarios

### P1. Botones superiores no cliqueables en mobile

Hallazgo:

- `#Config_Abrir` y `#Menu_Hamburguesa_Boton` existen y se ven.
- Pero un click normal falla porque otra capa intercepta el
  puntero.
- En el centro de ambos botones, `elementFromPoint()` devuelve
  `.Dia_Header`.

Evidencia:

- Captura: [01-home.png](C:\Users\Patricio\Documents\Codigo\Semaplan\Android\Auditoria\01-home.png)
- Prueba Playwright: `page.click()` timeout en ambos botones.
- Medicion:
  `Config_Abrir = 32x32`, `Menu_Hamburguesa_Boton = 32x32`.

Lectura tecnica:

- Hay un problema de stacking / hit testing.
- Aunque el boton se vea, en mobile no es tocable de forma
  confiable.

Codigo relacionado:

- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:754)
- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:7639)

### P1. Crear bloques en el calendario no funciona con touch

Hallazgo:

- Se creo un objetivo temporal solo en memoria.
- Se simulo un gesto touch desde la barra de objetivos hacia un slot
  del calendario.
- Antes del gesto habia `0` bloques.
- Despues del gesto siguio habiendo `0` bloques.
- Control: con `mouse drag` sobre la misma UI, el conteo paso de
  `0` a `1`.

Evidencia:

- Capturas:
  [06-touch-drag-before.png](C:\Users\Patricio\Documents\Codigo\Semaplan\Android\Auditoria\06-touch-drag-before.png)
  y
  [07-touch-drag-after.png](C:\Users\Patricio\Documents\Codigo\Semaplan\Android\Auditoria\07-touch-drag-after.png)

Lectura tecnica:

- La logica de calendario existe.
- El problema no es el drop en si.
- El problema es que el flujo depende de HTML5 drag desktop y no
  tiene un modelo touch equivalente.

Codigo relacionado:

- Objetivos: drag desde sidebar
  [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:39337)
- Slots: drop en calendario
  [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:40924)
- Resize / eventos por mouse
  [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:41060)

### P1. Varias acciones siguen pensadas para desktop

Hallazgo:

- En slots y eventos aparecen listeners de:
  `mouseenter`, `mouseleave`, `mousedown`, `dblclick`,
  `contextmenu`, `dragstart`.
- Eso cubre muy bien mouse y teclado.
- En telefono deja huecos funcionales o UX opaca.

Impacto:

- Slot muerto por doble click.
- Menus por click derecho.
- Tooltips por hover largo.
- Resize de bloques por borde con mouse.
- Reordenamientos varios solo por drag nativo.

Codigo relacionado:

- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:40926)
- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:40927)
- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:41067)
- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:44551)

### P2. Targets touch demasiado chicos

Hallazgo:

- Botones criticos y navegacion semanal estan en `32x32`.
- El cierre de config mide `28x28`.
- Muchos selects y pills quedan en `31px` o `38px` de alto.
- En la practica es menor al minimo razonable para dedo.

Ejemplos medidos:

- `Config_Abrir`: `32x32`
- `Menu_Hamburguesa_Boton`: `32x32`
- `Semana_Anterior`: `32x32`
- `Semana_Siguiente`: `32x32`
- `Config_Cerrar`: `28x28`
- `Mostrar_Creador`: `35px` de alto

Codigo relacionado:

- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:754)
- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:7639)
- [index.html](C:\Users\Patricio\Documents\Codigo\Semaplan\index.html:8886)

## Buenas noticias

- Login mobile entra bien en ancho.
- No aparecio overflow horizontal en login, home, baul,
  archivero ni config.
- Baul, archivero y config visualmente caben en pantalla.

Capturas:

- [05-login-mobile.png](C:\Users\Patricio\Documents\Codigo\Semaplan\Android\Auditoria\05-login-mobile.png)
- [02-baul.png](C:\Users\Patricio\Documents\Codigo\Semaplan\Android\Auditoria\02-baul.png)
- [03-archivero.png](C:\Users\Patricio\Documents\Codigo\Semaplan\Android\Auditoria\03-archivero.png)
- [04-config.png](C:\Users\Patricio\Documents\Codigo\Semaplan\Android\Auditoria\04-config.png)

Eso importa porque el problema no parece ser "todo el layout
esta destruido". El frente correcto es interaccion mobile.

## Recomendacion de enfoque

No conviene intentar "hacer que el drag desktop ande en touch"
como unica solucion. Es una trampa.

Conviene definir un modelo mobile explicito:

1. Crear bloque:
   tap en objetivo -> estado "lista para ubicar" ->
   tap en slot -> crear bloque.
2. Mover bloque:
   menu de bloque con accion "mover" o drag touch dedicado.
3. Resize:
   botones `+` / `-` o handle touch real con `pointer` events.
4. Menus:
   reemplazar `contextmenu` por boton visible o long-press.
5. Slot muerto:
   reemplazar `dblclick` por accion explicita.

## Orden recomendado

1. Arreglar stacking y clickabilidad de topbar.
2. Agrandar targets touch a minimo `44x44`.
3. Definir y aplicar un flujo mobile para crear bloques sin
   depender de HTML5 drag.
4. Reemplazar interacciones desktop-only:
   `dblclick`, `contextmenu`, hover y resize por mouse.
5. Reciem despues, sumar smoke tests mobile estables.
6. Reciem despues, pensar en Capacitor.

## Decision practica

La auditoria no recomienda arrancar ya con el wrapper Android.

Recomienda primero una fase de adaptacion mobile web enfocada en:

- topbar usable;
- calendario usable por touch;
- acciones principales sin click derecho ni doble click;
- targets mas grandes;
- smoke tests mobile para no volver a romperlo.


