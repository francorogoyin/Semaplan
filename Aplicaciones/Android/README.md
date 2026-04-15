# Android

Base Android de Semaplan con `Capacitor`.

Estructura:

- `Web/`: copia empaquetable del frontend actual.
- `App/`: proyecto `Capacitor` y wrapper Android.
- `Preparar_Web.js`: sincroniza `index.html` y assets hacia
  `Web/`.
- La auditoria mobile vive en
  `Documentacion/Auditorias/Android_Movil_2026_04_14/`.

Flujo de sync:

1. Ejecutar `node Aplicaciones/Android/Preparar_Web.js`.
2. Desde `Aplicaciones/Android/App`, ejecutar
   `npm run cap:sync`.

Build debug:

1. Tener JDK 21 y Android SDK 35 disponibles.
2. Desde `Aplicaciones/Android/App/android`, ejecutar:
   `gradlew.bat assembleDebug`

Salida esperada:

- `Aplicaciones/Android/App/android/app/build/outputs/apk/`
  `debug/app-debug.apk`
