# App de Metas Musicales — Propuesta Mejorada + Preguntas Inquisidoras

## Propuesta original (resumen)
Quiero una app para trackear y administrar escuchas, conectada a
Spotify, Last.fm y Semaplan.
Desde Semaplan defino metas musicales (por anio/mes/semana), y la app
detecta albumes planificados para un periodo y crea playlists en Spotify
automaticamente (ejemplo: inicio de semana 00:00).

## Propuesta mejorada (v1)

### Objetivo
Convertir metas musicales planificadas en Semaplan en ejecucion
automatica en Spotify, y medir cumplimiento con Last.fm.

### Rol de cada sistema
- Semaplan: fuente de verdad del plan (que album, cuando, para quien).
- Spotify: ejecucion (crear playlist y cargar tracks).
- Last.fm: verificacion analitica (si se escucho, cuanto, cuando).

### Flujo base
1. Usuario define objetivo musical en Semaplan.
2. La app detecta objetivos activos por periodo.
3. En el inicio del periodo (ej. lunes 00:00, zona horaria del
   usuario), crea playlist en Spotify.
4. Registra resultado de ejecucion (ok/error/reintentos).
5. (Fase 2) Cruza con Last.fm para medir avance real.

### Reglas de diseno recomendadas
- Idempotencia obligatoria: no duplicar playlist si el job corre dos
  veces.
- Trazabilidad: log por objetivo/periodo/resultado.
- Fallback de matching: preferir `Spotify Album ID`; evitar texto libre
  como fuente primaria.
- MVP acotado: primero semanal + un tipo de regla de playlist.

### Limitacion tecnica relevante
- Spotify Web API no expone gestion de carpetas de playlists
  (crear/listar/mover carpetas).
- Si "carpeta precisa" es requisito, resolver por convencion de nombre
  o organizacion manual en cliente Spotify.

## Preguntas inquisidoras (bloqueantes antes de implementar)

### A) Semaplan e integracion
1. Semaplan expone API/webhook para leer objetivos o hay que integrar
   por base/export?
2. Cual es el identificador unico del objetivo en Semaplan?
3. Que campos minimos trae cada objetivo musical (album, artista,
   periodo, prioridad, etc.)?

### B) Modelado de objetivos
4. El objetivo refiere a un album exacto (ID) o texto libre?
5. Si hay varias ediciones del mismo album, cual se elige?
6. Un objetivo puede tener varios albumes? En que orden?

### C) Ejecucion temporal
7. Zona horaria fuente: la del usuario, la de Semaplan o una fija?
8. Si el objetivo se crea tarde (periodo ya iniciado), crear inmediato o
   esperar proximo periodo?
9. Si falla a las 00:00, que politica de reintentos aplica
   (5/15/60 min)?
10. Que pasa si el objetivo se edita despues de creada la playlist?

### D) Spotify (resultado esperado)
11. Se crea una playlist por objetivo o una playlist consolidada por
    semana?
12. Naming obligatorio de playlist? (ej:
    `SMP 2026-W19 | Artista - Album`)
13. Playlist privada, publica o colaborativa por defecto?
14. Si el album no esta disponible en el mercado del usuario, como se
    resuelve?

### E) Last.fm y cumplimiento
15. Para que se usa Last.fm en v1: solo reporte o tambien decisiones
    automaticas?
16. Que define "cumplido"? (tracks completos, minutos, porcentaje,
    scrobbles)
17. Si Spotify y Last.fm discrepan, que fuente manda?

### F) Operacion y producto
18. Queres modo simulacion (dry-run) antes de escribir en Spotify?
19. Que visibilidad necesitas del sistema? (dashboard de jobs, historial,
    alertas)
20. Que nivel de tolerancia a errores aceptas por periodo (SLA
    personal)?

## Decisiones por defecto sugeridas (si queres cerrar rapido)
- 1 playlist por objetivo semanal.
- Trigger: inicio de semana 00:00 en zona horaria del usuario.
- Matching por Spotify Album ID.
- Idempotencia por llave: `usuario + objetivo + periodo`.
- Last.fm solo para reporte en v1; automatizacion con Last.fm en v2.

## Fuentes tecnicas verificadas
- Spotify Playlists (incluye limitacion de folders):
  https://developer.spotify.com/documentation/web-api/concepts/playlists
- Spotify Create Playlist:
  https://developer.spotify.com/documentation/web-api/reference/create-playlist
- Last.fm user.getRecentTracks:
  https://www.last.fm/api/show/user.getRecentTracks
