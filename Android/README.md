# Android

Base Android de Semaplan con `Capacitor`.

Estructura:

- `Web/`: copia empaquetable del frontend actual.
- `App/`: proyecto `Capacitor` y wrapper Android.
- `Preparar_Web.js`: sincroniza `index.html` y assets hacia
  `Web/`.
- `Auditoria/`: capturas y evidencia de la auditoría mobile.

Flujo de sync:

1. Ejecutar `node Android/Preparar_Web.js`.
2. Desde `Android/App`, ejecutar `npm run cap:sync`.

Build debug:

1. Tener JDK 21 y Android SDK 35 disponibles.
2. Desde `Android/App/android`, ejecutar:
   `gradlew.bat assembleDebug`

Salida esperada:

- `Android/App/android/app/build/outputs/apk/debug/app-debug.apk`
