import argparse as Argparse
import json as Json
import os as Os
import pathlib as Pathlib
import re as Re
import shutil as Shutil
import subprocess as Subprocess
import sys as Sys
import textwrap as Textwrap
import time as Time
import urllib.error as Urlerror
import urllib.request as Urlrequest


Ruta_Ayuda = Pathlib.Path(__file__).resolve().parents[1]
Ruta_Videos = Ruta_Ayuda / "Videos"
Ruta_Crudos = Ruta_Videos / "Crudos"
Ruta_Renderizados = Ruta_Videos / "Renderizados"
Ruta_Overlays = Ruta_Videos / "Overlays"
Ruta_Audios = Ruta_Videos / "Audio"
Ruta_Datos = Ruta_Videos / "Datos"
Ruta_Tutoriales = Ruta_Ayuda / "Tutoriales_En_Texto"


def Escribir_Mensaje(Texto: str) -> None:

    """
    Escribe un mensaje operativo por salida estandar.
    Centraliza los mensajes para que el flujo de comandos mantenga
    un idioma unico y resulte facil de ajustar mas adelante.

    Parametros:
    - Texto: Mensaje que debe mostrarse durante la ejecucion.

    Retorna:
    - None: No devuelve valores; solo informa estado al usuario.

    """

    try:
        print(Texto)
    except UnicodeEncodeError:
        Texto_Seguro = Texto.encode(
            "ascii",
            errors = "replace",
        ).decode("ascii")
        print(Texto_Seguro)


def Crear_Directorios_Base() -> None:

    """
    Crea las carpetas de trabajo del sistema de tutoriales.
    El sistema usa directorios separados para videos crudos,
    renderizados, overlays, audio y datos intermedios.

    Parametros:
    - Ninguno.

    Retorna:
    - None: La funcion solo asegura que existan las carpetas.

    """

    for Ruta in [
        Ruta_Crudos,
        Ruta_Renderizados,
        Ruta_Overlays,
        Ruta_Audios,
        Ruta_Datos,
        Ruta_Tutoriales,
    ]:
        Ruta.mkdir(parents = True, exist_ok = True)


def Cargar_Tutorial(
    Ruta_Tutorial: Pathlib.Path,
) -> dict[str, object]:

    """
    Lee y valida el contrato JSON de un tutorial.
    El contrato define el flujo navegable, los pasos de texto,
    los carteles, la narracion y la configuracion de salida.

    Parametros:
    - Ruta_Tutorial: Ruta del archivo JSON declarativo.

    Retorna:
    - dict[str, object]: Diccionario con la configuracion completa.

    """

    if not Ruta_Tutorial.exists():
        raise FileNotFoundError(
            f"No existe el tutorial: {Ruta_Tutorial}"
        )

    Texto = Ruta_Tutorial.read_text(encoding = "utf-8")
    Tutorial = Json.loads(Texto)

    if not isinstance(Tutorial, dict):
        raise ValueError("El tutorial debe ser un objeto JSON.")

    Identificador = Obtener_Cadena(Tutorial, "Identificador")
    Titulo = Obtener_Cadena(Tutorial, "Titulo")

    if not Identificador:
        raise ValueError("Falta `Identificador` en el tutorial.")

    if not Titulo:
        raise ValueError("Falta `Titulo` en el tutorial.")

    return Tutorial


def Obtener_Cadena(
    Datos: dict[str, object],
    Clave: str,
    Defecto: str = "",
) -> str:

    """
    Obtiene una cadena desde un diccionario heterogeneo.
    Evita repetir conversiones defensivas al leer contratos JSON
    escritos manualmente.

    Parametros:
    - Datos: Diccionario desde el cual se lee el valor.
    - Clave: Nombre de la clave buscada.
    - Defecto: Valor usado cuando la clave falta o queda vacia.

    Retorna:
    - str: Cadena normalizada sin espacios extremos.

    """

    Valor = Datos.get(Clave, Defecto)

    if Valor is None:
        return Defecto

    Texto = str(Valor).strip()

    if Texto:
        return Texto

    return Defecto


def Obtener_Numero(
    Datos: dict[str, object],
    Clave: str,
    Defecto: float,
) -> float:

    """
    Obtiene un numero desde un diccionario heterogeneo.
    Es tolerante a valores escritos como texto para que los JSON
    sean faciles de mantener a mano.

    Parametros:
    - Datos: Diccionario desde el cual se lee el valor.
    - Clave: Nombre de la clave buscada.
    - Defecto: Numero usado si no se puede convertir el valor.

    Retorna:
    - float: Numero normalizado para calculos de tiempo o posicion.

    """

    Valor = Datos.get(Clave, Defecto)

    try:
        return float(Valor)
    except (TypeError, ValueError):
        return Defecto


def Obtener_Bandera(
    Datos: dict[str, object],
    Clave: str,
    Defecto: bool,
) -> bool:

    """
    Obtiene un booleano desde el contrato JSON.
    Acepta booleanos reales y textos habituales como verdadero,
    falso, si, no, true y false.

    Parametros:
    - Datos: Diccionario desde el cual se lee el valor.
    - Clave: Nombre de la clave buscada.
    - Defecto: Valor usado cuando no hay dato confiable.

    Retorna:
    - bool: Valor booleano listo para usar en el flujo.

    """

    Valor = Datos.get(Clave, Defecto)

    if isinstance(Valor, bool):
        return Valor

    Texto = str(Valor).strip().lower()

    if Texto in ["true", "si", "s", "1", "yes"]:
        return True

    if Texto in ["false", "no", "n", "0"]:
        return False

    return Defecto


def Obtener_Resolucion(
    Tutorial: dict[str, object],
) -> tuple[int, int]:

    """
    Obtiene la resolucion objetivo del video.
    Si el tutorial no la define, usa 1920 por 1080 para producir
    piezas adecuadas para YouTube en formato horizontal.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - tuple[int, int]: Ancho y alto del video en pixeles.

    """

    Resolucion = Tutorial.get("Resolucion", {})

    if not isinstance(Resolucion, dict):
        return 1920, 1080

    Ancho = int(Obtener_Numero(Resolucion, "Ancho", 1920))
    Alto = int(Obtener_Numero(Resolucion, "Alto", 1080))

    return Ancho, Alto


def Obtener_Identificador(
    Tutorial: dict[str, object],
) -> str:

    """
    Obtiene el identificador estable del tutorial.
    Ese identificador se usa como base de nombres para videos,
    overlays, datos intermedios y tutoriales escritos.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - str: Identificador normalizado del tutorial.

    """

    Identificador = Obtener_Cadena(Tutorial, "Identificador")
    return Identificador.replace(" ", "_")


def Obtener_Lista_Diccionarios(
    Datos: dict[str, object],
    Clave: str,
) -> list[dict[str, object]]:

    """
    Lee una lista de objetos desde un diccionario.
    Descarta elementos que no sean objetos para que un error menor
    en el JSON no rompa operaciones que no dependen de ese elemento.

    Parametros:
    - Datos: Diccionario desde el cual se lee la lista.
    - Clave: Nombre de la clave buscada.

    Retorna:
    - list[dict[str, object]]: Lista filtrada de objetos JSON.

    """

    Valor = Datos.get(Clave, [])

    if not isinstance(Valor, list):
        return []

    return [
        Elemento
        for Elemento in Valor
        if isinstance(Elemento, dict)
    ]


def Generar_Tutorial_Texto(
    Tutorial: dict[str, object],
) -> Pathlib.Path:

    """
    Genera el tutorial escrito a partir del contrato JSON.
    El archivo resultante sirve como ayuda del producto, guion
    editorial y base para descripcion, capitulos y subtitulos.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - Pathlib.Path: Ruta del archivo Markdown generado.

    """

    Crear_Directorios_Base()

    Identificador = Obtener_Identificador(Tutorial)
    Titulo = Obtener_Cadena(Tutorial, "Titulo")
    Descripcion = Obtener_Cadena(Tutorial, "Descripcion_Corta")
    Pasos = Obtener_Lista_Diccionarios(Tutorial, "Pasos_Texto")
    Narracion = Obtener_Lista_Diccionarios(Tutorial, "Narracion")
    Carteles = Obtener_Carteles_Consolidados(Tutorial)
    Youtube = Tutorial.get("Youtube", {})

    if not isinstance(Youtube, dict):
        Youtube = {}

    Lineas: list[str] = []
    Lineas.append(f"# {Titulo}.")
    Lineas.append("")

    if Descripcion:
        Lineas.append(Descripcion.rstrip(".") + ".")
        Lineas.append("")

    Lineas.append("## Pasos.")
    Lineas.append("")

    for Indice, Paso in enumerate(Pasos, start = 1):
        Titulo_Paso = Obtener_Cadena(Paso, "Titulo", f"Paso {Indice}")
        Texto_Paso = Obtener_Cadena(Paso, "Texto")
        Lineas.append(f"{Indice}. {Titulo_Paso.rstrip('.')}.")

        if Texto_Paso:
            Lineas.append(f"   {Texto_Paso.rstrip('.')}.")

    if not Pasos:
        Lineas.append(
            "1. Completar los pasos del tutorial en el contrato JSON."
        )

    Lineas.append("")
    Lineas.append("## Guion de narracion.")
    Lineas.append("")

    Texto_Narracion = Obtener_Texto_Narracion(Narracion)

    if Texto_Narracion:
        Lineas.append(Texto_Narracion)
    else:
        Lineas.append("Completar narracion antes de generar voz.")

    Lineas.append("")
    Lineas.append("## Carteles del video.")
    Lineas.append("")

    if Carteles:
        for Cartel in Carteles:
            Inicio = Formatear_Tiempo(
                float(Cartel["Inicio"])
            )
            Fin = Formatear_Tiempo(float(Cartel["Fin"]))
            Texto_Cartel = str(Cartel["Texto"]).rstrip(".")
            Lineas.append(f"- {Inicio} - {Fin}: {Texto_Cartel}.")
    else:
        Lineas.append("- Sin carteles definidos.")

    Lineas.append("")
    Lineas.append("## YouTube.")
    Lineas.append("")

    Titulo_Youtube = Obtener_Cadena(Youtube, "Titulo", Titulo)
    Descripcion_Youtube = Obtener_Cadena(Youtube, "Descripcion")
    Etiquetas = Youtube.get("Etiquetas", [])

    Lineas.append(f"Titulo: {Titulo_Youtube}.")

    if Descripcion_Youtube:
        Lineas.append("")
        Lineas.append(Descripcion_Youtube.rstrip(".") + ".")

    if isinstance(Etiquetas, list) and Etiquetas:
        Etiquetas_Texto = ", ".join(
            str(Etiqueta) for Etiqueta in Etiquetas
        )
        Lineas.append("")
        Lineas.append(f"Etiquetas: {Etiquetas_Texto}.")

    if Carteles:
        Lineas.append("")
        Lineas.append("Capitulos sugeridos.")
        Lineas.append("")

        for Cartel in Carteles:
            Inicio = Formatear_Tiempo_Capitulo(
                float(Cartel["Inicio"])
            )
            Texto_Cartel = str(Cartel["Texto"]).rstrip(".")
            Lineas.append(f"{Inicio} {Texto_Cartel}.")

    Ruta_Salida = Ruta_Tutoriales / f"{Identificador}.md"
    Ruta_Salida.write_text(
        "\n".join(Lineas) + "\n",
        encoding = "utf-8",
    )

    return Ruta_Salida


def Obtener_Texto_Narracion(
    Narracion: list[dict[str, object]],
) -> str:

    """
    Compone el texto de narracion desde una lista de segmentos.
    Cada segmento puede incluir solo texto o texto con tiempos,
    pero para la voz se genera una pieza continua.

    Parametros:
    - Narracion: Lista de segmentos narrativos del tutorial.

    Retorna:
    - str: Texto completo de narracion separado por parrafos.

    """

    Partes: list[str] = []

    for Segmento in Narracion:
        Texto = Obtener_Cadena(Segmento, "Texto")

        if Texto:
            Partes.append(Texto.rstrip(".") + ".")

    return "\n\n".join(Partes)


def Formatear_Tiempo(Segundos: float) -> str:

    """
    Formatea segundos como marca de tiempo legible.
    Se usa para documentar carteles y rangos internos del video.

    Parametros:
    - Segundos: Tiempo expresado en segundos desde el inicio.

    Retorna:
    - str: Tiempo formateado como MM:SS.

    """

    Segundos_Enteros = int(max(0, Segundos))
    Minutos = Segundos_Enteros // 60
    Resto = Segundos_Enteros % 60

    return f"{Minutos:02d}:{Resto:02d}"


def Formatear_Tiempo_Capitulo(Segundos: float) -> str:

    """
    Formatea segundos para capitulos compatibles con YouTube.
    Mantiene el formato habitual M:SS para pegarlo directamente
    en la descripcion del video.

    Parametros:
    - Segundos: Tiempo expresado en segundos desde el inicio.

    Retorna:
    - str: Tiempo formateado como M:SS.

    """

    Segundos_Enteros = int(max(0, Segundos))
    Minutos = Segundos_Enteros // 60
    Resto = Segundos_Enteros % 60

    return f"{Minutos}:{Resto:02d}"


def Obtener_Carteles_Consolidados(
    Tutorial: dict[str, object],
) -> list[dict[str, object]]:

    """
    Une carteles escritos a mano con eventos generados al grabar.
    Los carteles manuales permiten direccion editorial precisa;
    los generados desde acciones aceleran tutoriales simples.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - list[dict[str, object]]: Carteles ordenados por inicio.

    """

    Carteles: list[dict[str, object]] = []
    Duracion_Defecto = Obtener_Numero(
        Tutorial,
        "Duracion_Cartel_Segundos",
        3.5,
    )

    for Cartel in Obtener_Lista_Diccionarios(Tutorial, "Carteles"):
        Cartel_Normalizado = Normalizar_Cartel(
            Cartel,
            Duracion_Defecto,
        )

        if Cartel_Normalizado:
            Carteles.append(Cartel_Normalizado)

    for Cartel in Cargar_Eventos_Generados(Tutorial):
        Cartel_Normalizado = Normalizar_Cartel(
            Cartel,
            Duracion_Defecto,
        )

        if Cartel_Normalizado:
            Carteles.append(Cartel_Normalizado)

    return sorted(Carteles, key = lambda Elemento: Elemento["Inicio"])


def Normalizar_Cartel(
    Cartel: dict[str, object],
    Duracion_Defecto: float,
) -> dict[str, object] | None:

    """
    Normaliza un cartel para renderizarlo con tiempos validos.
    Elimina carteles sin texto y completa el final cuando solo
    se define un inicio.

    Parametros:
    - Cartel: Cartel leido desde JSON o desde eventos.
    - Duracion_Defecto: Duracion usada cuando falta el campo Fin.

    Retorna:
    - dict[str, object] | None: Cartel listo o None si no sirve.

    """

    Texto = Obtener_Cadena(Cartel, "Texto")

    if not Texto:
        return None

    Inicio = Obtener_Numero(Cartel, "Inicio", 0.0)
    Fin = Obtener_Numero(Cartel, "Fin", Inicio + Duracion_Defecto)

    if Fin <= Inicio:
        Fin = Inicio + Duracion_Defecto

    return {
        "Inicio": Inicio,
        "Fin": Fin,
        "Texto": Texto,
        "Posicion": Obtener_Cadena(Cartel, "Posicion", "Inferior"),
        "Area": Cartel.get("Area"),
    }


def Cargar_Eventos_Generados(
    Tutorial: dict[str, object],
) -> list[dict[str, object]]:

    """
    Carga carteles generados durante una captura previa.
    Si aun no hay captura, devuelve una lista vacia y permite
    que el resto del sistema siga funcionando.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - list[dict[str, object]]: Eventos generados por Playwright.

    """

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Eventos = Ruta_Datos / f"{Identificador}_Eventos.json"

    if not Ruta_Eventos.exists():
        return []

    try:
        Datos = Json.loads(
            Ruta_Eventos.read_text(encoding = "utf-8")
        )
    except Json.JSONDecodeError:
        return []

    if not isinstance(Datos, list):
        return []

    return [Evento for Evento in Datos if isinstance(Evento, dict)]


def Capturar_Video(
    Tutorial: dict[str, object],
) -> Pathlib.Path:

    """
    Ejecuta acciones en Chromium y graba el navegador.
    Usa Playwright para que el recorrido sea reproducible y para
    producir un video crudo que luego pueda renderizarse.

    Parametros:
    - Tutorial: Contrato completo con acciones navegables.

    Retorna:
    - Pathlib.Path: Ruta del video crudo generado.

    """

    try:
        from playwright.sync_api import sync_playwright \
            as Iniciar_Playwright
    except ImportError as Error:
        raise RuntimeError(
            "Falta instalar Playwright para Python. "
            "Ejecuta `Ayuda\\Sistema_Tutoriales\\"
            "Instalar_Dependencias.ps1`."
        ) from Error

    Crear_Directorios_Base()

    Identificador = Obtener_Identificador(Tutorial)
    Acciones = Obtener_Lista_Diccionarios(Tutorial, "Acciones")
    Ancho, Alto = Obtener_Resolucion(Tutorial)
    Headless = Obtener_Bandera(Tutorial, "Headless", False)
    Ruta_Salida = Ruta_Crudos / f"{Identificador}.webm"
    Eventos: list[dict[str, object]] = []

    if not Acciones:
        raise ValueError("El tutorial no tiene acciones para grabar.")

    with Iniciar_Playwright() as Playwright:
        Navegador = Playwright.chromium.launch(headless = Headless)
        Configuracion_Contexto: dict[str, object] = {
            "viewport": {"width": Ancho, "height": Alto},
            "record_video_dir": str(Ruta_Crudos),
            "record_video_size": {"width": Ancho, "height": Alto},
        }
        Ruta_Storage_State = Resolver_Ruta_Opcional(
            Obtener_Cadena(Tutorial, "Storage_State")
        )

        if Ruta_Storage_State is not None:
            Configuracion_Contexto["storage_state"] = str(
                Ruta_Storage_State
            )

        Contexto = Navegador.new_context(**Configuracion_Contexto)
        Pagina = Contexto.new_page()
        Tiempo_Base = Time.perf_counter()

        for Accion in Acciones:
            Tiempo_Accion = Time.perf_counter() - Tiempo_Base
            Agregar_Evento_Desde_Accion(
                Eventos,
                Accion,
                Tiempo_Accion,
                Tutorial,
            )
            Ejecutar_Accion_Playwright(Pagina, Accion)

        Pagina.wait_for_timeout(1000)
        Video = Pagina.video
        Contexto.close()
        Navegador.close()

        if Video is None:
            raise RuntimeError("Playwright no genero video.")

        Ruta_Original = Pathlib.Path(Video.path())

    if Ruta_Salida.exists():
        Ruta_Salida.unlink()

    Shutil.move(str(Ruta_Original), str(Ruta_Salida))

    Ruta_Eventos = Ruta_Datos / f"{Identificador}_Eventos.json"
    Ruta_Eventos.write_text(
        Json.dumps(Eventos, indent = 2, ensure_ascii = False) + "\n",
        encoding = "utf-8",
    )

    return Ruta_Salida


def Agregar_Evento_Desde_Accion(
    Eventos: list[dict[str, object]],
    Accion: dict[str, object],
    Inicio: float,
    Tutorial: dict[str, object],
) -> None:

    """
    Agrega un cartel automatico asociado a una accion.
    Esto permite que una accion como click o relleno defina su
    propio cartel sin escribir una linea separada en Carteles.

    Parametros:
    - Eventos: Lista mutable de eventos generados.
    - Accion: Accion actual del flujo de Playwright.
    - Inicio: Momento de inicio relativo de la accion.
    - Tutorial: Contrato completo para leer duraciones por defecto.

    Retorna:
    - None: La funcion modifica la lista recibida.

    """

    Texto = Obtener_Cadena(Accion, "Cartel")

    if not Texto:
        return

    Duracion = Obtener_Numero(
        Accion,
        "Duracion_Cartel_Segundos",
        Obtener_Numero(Tutorial, "Duracion_Cartel_Segundos", 3.5),
    )

    Eventos.append(
        {
            "Inicio": round(Inicio, 2),
            "Fin": round(Inicio + Duracion, 2),
            "Texto": Texto,
            "Posicion": Obtener_Cadena(
                Accion,
                "Posicion",
                "Inferior",
            ),
            "Area": Accion.get("Area"),
        }
    )


def Ejecutar_Accion_Playwright(
    Pagina: object,
    Accion: dict[str, object],
) -> None:

    """
    Ejecuta una accion del contrato sobre la pagina de Playwright.
    Soporta navegacion, click, relleno, teclas, espera, hover,
    scroll, evaluacion controlada y captura de pantalla.

    Parametros:
    - Pagina: Pagina activa de Playwright.
    - Accion: Accion declarada en el tutorial.

    Retorna:
    - None: La accion opera directamente sobre el navegador.

    """

    Tipo = Obtener_Cadena(Accion, "Tipo").replace("-", "_").lower()
    Selector = Obtener_Cadena(Accion, "Selector")
    Tiempo_Espera = int(Obtener_Numero(Accion, "Tiempo_Espera_Ms", 0))

    if Tiempo_Espera > 0:
        Pagina.wait_for_timeout(Tiempo_Espera)

    if Tipo == "ir_a":
        Url = Obtener_Cadena(Accion, "Url")
        Pagina.goto(
            Url,
            wait_until = Obtener_Cadena(
                Accion,
                "Esperar_Carga",
                "domcontentloaded",
            ),
            timeout = int(
                Obtener_Numero(Accion, "Timeout_Ms", 120000)
            ),
        )
        return

    if Tipo == "click":
        Pagina.locator(Selector).click()
        return

    if Tipo == "rellenar":
        Texto = Obtener_Cadena(Accion, "Texto")
        Pagina.locator(Selector).fill(Texto)
        return

    if Tipo == "presionar":
        Tecla = Obtener_Cadena(Accion, "Tecla")
        Pagina.keyboard.press(Tecla)
        return

    if Tipo == "esperar":
        Segundos = Obtener_Numero(Accion, "Segundos", 1.0)
        Pagina.wait_for_timeout(int(Segundos * 1000))
        return

    if Tipo == "esperar_selector":
        Pagina.wait_for_selector(Selector)
        return

    if Tipo == "esperar_funcion":
        Codigo = Obtener_Cadena(Accion, "Codigo")
        Pagina.wait_for_function(
            Codigo,
            timeout = int(
                Obtener_Numero(Accion, "Timeout_Ms", 120000)
            ),
        )
        return

    if Tipo == "hover":
        Pagina.locator(Selector).hover()
        return

    if Tipo == "scroll":
        Pixeles_X = Obtener_Numero(Accion, "Pixeles_X", 0.0)
        Pixeles_Y = Obtener_Numero(Accion, "Pixeles_Y", 600.0)
        Pagina.mouse.wheel(Pixeles_X, Pixeles_Y)
        return

    if Tipo == "evaluar":
        Codigo = Obtener_Cadena(Accion, "Codigo")
        Pagina.evaluate(Codigo)
        return

    if Tipo == "captura":
        Nombre = Obtener_Cadena(Accion, "Nombre", "Captura")
        Ruta_Captura = Ruta_Datos / f"{Nombre}.png"
        Pagina.screenshot(path = str(Ruta_Captura), full_page = True)
        return

    if Tipo == "pausa_manual":
        Mensaje = Obtener_Cadena(
            Accion,
            "Mensaje",
            "Completa la accion manual y presiona Enter.",
        )
        input(Mensaje + " ")
        return

    raise ValueError(f"Tipo de accion no soportado: {Tipo}")


def Resolver_Ruta_Opcional(
    Texto_Ruta: str,
) -> Pathlib.Path | None:

    """
    Resuelve una ruta opcional definida en el contrato JSON.
    Permite escribir rutas relativas al repo sin obligar a usar
    rutas absolutas en cada tutorial.

    Parametros:
    - Texto_Ruta: Texto de ruta recibido desde el contrato.

    Retorna:
    - Pathlib.Path | None: Ruta resuelta o None si no hay texto.

    """

    if not Texto_Ruta:
        return None

    Ruta = Pathlib.Path(Texto_Ruta)

    if Ruta.is_absolute():
        return Ruta

    return Pathlib.Path.cwd() / Ruta


def Generar_Audio_Narracion(
    Tutorial: dict[str, object],
) -> Pathlib.Path:

    """
    Genera un archivo de voz con ElevenLabs.
    La integracion es opcional y depende de variables de entorno,
    para no guardar secretos ni voces privadas dentro del repo.

    Parametros:
    - Tutorial: Contrato completo con narracion y datos de voz.

    Retorna:
    - Pathlib.Path: Ruta del archivo MP3 generado.

    """

    Crear_Directorios_Base()

    Api_Key = Os.environ.get("ELEVENLABS_API_KEY", "").strip()
    Voz_Entorno = Os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    Voz = Tutorial.get("Voz", {})

    if not isinstance(Voz, dict):
        Voz = {}

    Voice_Id = Obtener_Cadena(Voz, "Elevenlabs_Voice_Id", Voz_Entorno)
    Modelo = Obtener_Cadena(Voz, "Modelo", "eleven_multilingual_v2")
    Narracion = Obtener_Lista_Diccionarios(Tutorial, "Narracion")
    Texto = Obtener_Texto_Narracion(Narracion)

    if not Api_Key:
        raise RuntimeError("Falta la variable ELEVENLABS_API_KEY.")

    if not Voice_Id:
        raise RuntimeError("Falta Elevenlabs_Voice_Id o entorno.")

    if not Texto:
        raise RuntimeError("El tutorial no tiene texto de narracion.")

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Salida = Ruta_Audios / f"{Identificador}.mp3"
    Url = f"https://api.elevenlabs.io/v1/text-to-speech/{Voice_Id}"

    Cuerpo = Json.dumps(
        {
            "text": Texto,
            "model_id": Modelo,
            "voice_settings": {
                "stability": 0.52,
                "similarity_boost": 0.78,
            },
        }
    ).encode("utf-8")

    Solicitud = Urlrequest.Request(
        Url,
        data = Cuerpo,
        headers = {
            "xi-api-key": Api_Key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method = "POST",
    )

    try:
        with Urlrequest.urlopen(
            Solicitud,
            timeout = 120,
        ) as Respuesta:
            Ruta_Salida.write_bytes(Respuesta.read())
    except Urlerror.HTTPError as Error:
        Detalle = Error.read().decode("utf-8", errors = "ignore")
        raise RuntimeError(f"Fallo ElevenLabs: {Detalle}") from Error

    return Ruta_Salida


def Renderizar_Video(
    Tutorial: dict[str, object],
    Ruta_Crudo_Manual: Pathlib.Path | None = None,
) -> Pathlib.Path:

    """
    Renderiza el video final con overlays y audio opcional.
    Usa FFmpeg directo para evitar depender de editores cerrados
    y para mantener el proceso repetible desde el contrato JSON.

    Parametros:
    - Tutorial: Contrato completo del tutorial.
    - Ruta_Crudo_Manual: Video crudo alternativo si se especifica.

    Retorna:
    - Pathlib.Path: Ruta del archivo MP4 renderizado.

    """

    Crear_Directorios_Base()

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Crudo = Ruta_Crudo_Manual

    if Ruta_Crudo is None:
        Ruta_Crudo = Ruta_Crudos / f"{Identificador}.webm"

    if not Ruta_Crudo.exists():
        raise FileNotFoundError(
            f"No existe el video crudo: {Ruta_Crudo}"
        )

    Ruta_Ffmpeg = Buscar_Ffmpeg()
    Ruta_Audio = Ruta_Audios / f"{Identificador}.mp3"
    Ruta_Salida = Ruta_Renderizados / f"{Identificador}.mp4"
    Carteles = Obtener_Carteles_Consolidados(Tutorial)
    Overlays = Crear_Overlays(Tutorial, Carteles)
    Comando = Construir_Comando_Ffmpeg(
        Ruta_Ffmpeg,
        Ruta_Crudo,
        Ruta_Salida,
        Overlays,
        Carteles,
        Ruta_Audio if Ruta_Audio.exists() else None,
        Obtener_Duracion_Video(Ruta_Ffmpeg, Ruta_Crudo),
    )

    Ejecutar_Ffmpeg(Comando)

    return Ruta_Salida


def Buscar_Ffmpeg() -> str:

    """
    Encuentra un ejecutable de FFmpeg disponible.
    Primero respeta FFMPEG_PATH, luego busca en PATH y por ultimo
    usa imageio-ffmpeg si fue instalado con las dependencias.

    Parametros:
    - Ninguno.

    Retorna:
    - str: Ruta ejecutable de FFmpeg.

    """

    Ruta_Entorno = Os.environ.get("FFMPEG_PATH", "").strip()

    if Ruta_Entorno and Pathlib.Path(Ruta_Entorno).exists():
        return Ruta_Entorno

    Ruta_Path = Shutil.which("ffmpeg")

    if Ruta_Path:
        return Ruta_Path

    try:
        import imageio_ffmpeg as Imageio_Ffmpeg

        return Imageio_Ffmpeg.get_ffmpeg_exe()
    except ImportError as Error:
        raise RuntimeError(
            "Falta FFmpeg. Instala dependencias o define FFMPEG_PATH."
        ) from Error


def Crear_Overlays(
    Tutorial: dict[str, object],
    Carteles: list[dict[str, object]],
) -> list[Pathlib.Path]:

    """
    Crea imagenes transparentes para superponer en el video.
    Cada cartel se convierte en un PNG del mismo tamano que el
    video, con caja de texto y area resaltada opcional.

    Parametros:
    - Tutorial: Contrato completo con resolucion de salida.
    - Carteles: Lista de carteles normalizados.

    Retorna:
    - list[Pathlib.Path]: Rutas de las imagenes PNG generadas.

    """

    if not Carteles:
        return []

    try:
        from PIL import Image as Imagen
        from PIL import ImageDraw as Imagen_Dibujo
        from PIL import ImageFont as Imagen_Fuente
    except ImportError as Error:
        raise RuntimeError(
            "Falta Pillow para crear overlays."
        ) from Error

    Identificador = Obtener_Identificador(Tutorial)
    Ancho, Alto = Obtener_Resolucion(Tutorial)
    Fuente = Cargar_Fuente(Imagen_Fuente, 42)
    Fuente_Chica = Cargar_Fuente(Imagen_Fuente, 34)
    Rutas: list[Pathlib.Path] = []

    for Indice, Cartel in enumerate(Carteles, start = 1):
        Fondo = Imagen.new("RGBA", (Ancho, Alto), (0, 0, 0, 0))
        Dibujo = Imagen_Dibujo.Draw(Fondo)
        Dibujar_Area(Dibujo, Cartel)
        Dibujar_Caja_Texto(
            Dibujo,
            Cartel,
            Ancho,
            Alto,
            Fuente,
            Fuente_Chica,
        )
        Ruta_Overlay = Ruta_Overlays / (
            f"{Identificador}_Overlay_{Indice:03d}.png"
        )
        Fondo.save(Ruta_Overlay)
        Rutas.append(Ruta_Overlay)

    return Rutas


def Cargar_Fuente(
    Imagen_Fuente: object,
    Tamano: int,
) -> object:

    """
    Carga una fuente del sistema con fallback seguro.
    Usa fuentes habituales de Windows si existen y cae en la
    fuente por defecto de Pillow cuando no estan disponibles.

    Parametros:
    - Imagen_Fuente: Modulo ImageFont de Pillow.
    - Tamano: Tamano tipografico deseado.

    Retorna:
    - object: Fuente lista para dibujar texto.

    """

    Candidatas = [
        Pathlib.Path("C:/Windows/Fonts/segoeui.ttf"),
        Pathlib.Path("C:/Windows/Fonts/arial.ttf"),
    ]

    for Ruta_Fuente in Candidatas:
        if Ruta_Fuente.exists():
            return Imagen_Fuente.truetype(str(Ruta_Fuente), Tamano)

    return Imagen_Fuente.load_default()


def Dibujar_Area(
    Dibujo: object,
    Cartel: dict[str, object],
) -> None:

    """
    Dibuja un resaltado sobre un area de pantalla.
    El area se expresa como cuatro numeros: x, y, ancho y alto,
    en coordenadas del video final.

    Parametros:
    - Dibujo: Objeto ImageDraw de Pillow.
    - Cartel: Cartel que puede incluir el campo Area.

    Retorna:
    - None: Dibuja directamente sobre la imagen recibida.

    """

    Area = Cartel.get("Area")

    if not isinstance(Area, list) or len(Area) != 4:
        return

    try:
        X, Y, Ancho, Alto = [int(Valor) for Valor in Area]
    except (TypeError, ValueError):
        return

    Dibujo.rounded_rectangle(
        [X, Y, X + Ancho, Y + Alto],
        radius = 18,
        outline = (255, 202, 40, 245),
        width = 8,
    )


def Dibujar_Caja_Texto(
    Dibujo: object,
    Cartel: dict[str, object],
    Ancho: int,
    Alto: int,
    Fuente: object,
    Fuente_Chica: object,
) -> None:

    """
    Dibuja la caja visible de texto de un cartel.
    Usa una composicion sobria: fondo oscuro, borde suave y texto
    blanco para funcionar sobre pantallas claras u oscuras.

    Parametros:
    - Dibujo: Objeto ImageDraw de Pillow.
    - Cartel: Cartel con texto y posicion.
    - Ancho: Ancho del video.
    - Alto: Alto del video.
    - Fuente: Fuente principal.
    - Fuente_Chica: Fuente secundaria para textos largos.

    Retorna:
    - None: Dibuja directamente sobre la imagen recibida.

    """

    Texto = str(Cartel["Texto"]).strip()
    Fuente_Usada = Fuente if len(Texto) <= 110 else Fuente_Chica
    Texto_Envuelto = "\n".join(Textwrap.wrap(Texto, width = 48))
    Caja_Texto = Dibujo.multiline_textbbox(
        (0, 0),
        Texto_Envuelto,
        font = Fuente_Usada,
        spacing = 12,
    )
    Ancho_Texto = Caja_Texto[2] - Caja_Texto[0]
    Alto_Texto = Caja_Texto[3] - Caja_Texto[1]
    Margen = 56
    Relleno_X = 34
    Relleno_Y = 24
    Ancho_Caja = min(
        Ancho - (Margen * 2),
        Ancho_Texto + Relleno_X * 2,
    )
    Alto_Caja = Alto_Texto + Relleno_Y * 2
    Posicion = str(Cartel.get("Posicion", "Inferior")).lower()
    X = int((Ancho - Ancho_Caja) / 2)
    Y = Alto - Alto_Caja - Margen

    if Posicion == "superior":
        Y = Margen
    elif Posicion == "centro":
        Y = int((Alto - Alto_Caja) / 2)
    elif Posicion == "izquierda":
        X = Margen
        Y = int((Alto - Alto_Caja) / 2)
    elif Posicion == "derecha":
        X = Ancho - Ancho_Caja - Margen
        Y = int((Alto - Alto_Caja) / 2)

    Dibujo.rounded_rectangle(
        [X, Y, X + Ancho_Caja, Y + Alto_Caja],
        radius = 20,
        fill = (24, 31, 42, 232),
        outline = (255, 255, 255, 68),
        width = 2,
    )
    Dibujo.multiline_text(
        (X + Relleno_X, Y + Relleno_Y),
        Texto_Envuelto,
        font = Fuente_Usada,
        fill = (255, 255, 255, 255),
        spacing = 12,
    )


def Construir_Comando_Ffmpeg(
    Ruta_Ffmpeg: str,
    Ruta_Crudo: Pathlib.Path,
    Ruta_Salida: Pathlib.Path,
    Overlays: list[Pathlib.Path],
    Carteles: list[dict[str, object]],
    Ruta_Audio: Pathlib.Path | None,
    Duracion_Video: float | None,
) -> list[str]:

    """
    Construye el comando FFmpeg para renderizar el MP4 final.
    El comando superpone imagenes transparentes en los rangos
    definidos y usa audio de narracion cuando existe.

    Parametros:
    - Ruta_Ffmpeg: Ejecutable de FFmpeg.
    - Ruta_Crudo: Video base grabado por Playwright.
    - Ruta_Salida: Archivo MP4 final.
    - Overlays: Imagenes transparentes de carteles.
    - Carteles: Carteles con tiempos para activar overlays.
    - Ruta_Audio: Audio narrado opcional.
    - Duracion_Video: Duracion maxima del video base.

    Retorna:
    - list[str]: Argumentos listos para Subprocess.run.

    """

    Comando = [Ruta_Ffmpeg, "-y", "-i", str(Ruta_Crudo)]

    for Ruta_Overlay in Overlays:
        Comando.extend(["-loop", "1", "-i", str(Ruta_Overlay)])

    Indice_Audio = 1 + len(Overlays)

    if Ruta_Audio is not None:
        Comando.extend(["-i", str(Ruta_Audio)])

    if Overlays:
        Filtro, Etiqueta_Final = Construir_Filtro_Overlays(Carteles)
        Comando.extend(["-filter_complex", Filtro])
        Comando.extend(["-map", Etiqueta_Final])
    else:
        Comando.extend(["-map", "0:v"])

    if Ruta_Audio is not None:
        Comando.extend(["-map", f"{Indice_Audio}:a"])
    else:
        Comando.extend(["-map", "0:a?"])

    if Duracion_Video is not None:
        Comando.extend(["-t", f"{Duracion_Video:.3f}"])

    Comando.extend(
        [
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            str(Ruta_Salida),
        ]
    )

    return Comando


def Construir_Filtro_Overlays(
    Carteles: list[dict[str, object]],
) -> tuple[str, str]:

    """
    Construye el filtergraph de overlays para FFmpeg.
    Cada imagen se activa solo dentro del rango de tiempo del
    cartel correspondiente.

    Parametros:
    - Carteles: Carteles normalizados y ordenados.

    Retorna:
    - tuple[str, str]: Filtergraph y etiqueta de video final.

    """

    Partes: list[str] = []
    Entrada_Actual = "[0:v]"

    for Indice, Cartel in enumerate(Carteles, start = 1):
        Entrada_Overlay = f"[{Indice}:v]"
        Salida = f"[v{Indice}]"
        Inicio = f"{float(Cartel['Inicio']):.2f}"
        Fin = f"{float(Cartel['Fin']):.2f}"
        Partes.append(
            f"{Entrada_Actual}{Entrada_Overlay}"
            f"overlay=0:0:shortest=1:"
            f"enable='between(t,{Inicio},{Fin})'"
            f"{Salida}"
        )
        Entrada_Actual = Salida

    return ";".join(Partes), Entrada_Actual


def Ejecutar_Ffmpeg(
    Comando: list[str],
) -> None:

    """
    Ejecuta FFmpeg sin inundar la salida de consola.
    Si FFmpeg falla, conserva stderr para que el error siga siendo
    diagnosticable sin mostrar logs enormes en ejecuciones normales.

    Parametros:
    - Comando: Lista completa de argumentos para FFmpeg.

    Retorna:
    - None: Lanza RuntimeError si el proceso falla.

    """

    Proceso = Subprocess.run(
        Comando,
        capture_output = True,
        text = True,
    )

    if Proceso.returncode == 0:
        return

    Detalle = (Proceso.stderr or Proceso.stdout or "").strip()
    raise RuntimeError(f"FFmpeg fallo: {Detalle}")


def Obtener_Duracion_Video(
    Ruta_Ffmpeg: str,
    Ruta_Video: Pathlib.Path,
) -> float | None:

    """
    Obtiene la duracion de un video usando FFmpeg.
    Se usa para que los overlays de imagen fija no estiren el
    render indefinidamente cuando no hay pista de audio.

    Parametros:
    - Ruta_Ffmpeg: Ejecutable de FFmpeg disponible.
    - Ruta_Video: Archivo de video base que se va a renderizar.

    Retorna:
    - float | None: Duracion en segundos o None si no pudo leerse.

    """

    Comando = [
        Ruta_Ffmpeg,
        "-hide_banner",
        "-i",
        str(Ruta_Video),
    ]
    Proceso = Subprocess.run(
        Comando,
        capture_output = True,
        text = True,
    )
    Texto = (Proceso.stderr or "") + (Proceso.stdout or "")
    Coincidencia = Re.search(
        r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)",
        Texto,
    )

    if Coincidencia is None:
        return None

    Horas = int(Coincidencia.group(1))
    Minutos = int(Coincidencia.group(2))
    Segundos = float(Coincidencia.group(3))

    return Horas * 3600 + Minutos * 60 + Segundos


def Ejecutar_Todo(
    Tutorial: dict[str, object],
) -> None:

    """
    Ejecuta el flujo completo de generacion de un tutorial.
    Crea texto, captura video, intenta generar voz si hay entorno
    configurado y renderiza el video final.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - None: Informa rutas generadas por salida estandar.

    """

    Ruta_Texto = Generar_Tutorial_Texto(Tutorial)
    Escribir_Mensaje(f"Texto generado: {Ruta_Texto}")

    Ruta_Crudo = Capturar_Video(Tutorial)
    Escribir_Mensaje(f"Video crudo generado: {Ruta_Crudo}")

    try:
        Ruta_Audio = Generar_Audio_Narracion(Tutorial)
        Escribir_Mensaje(f"Audio generado: {Ruta_Audio}")
    except RuntimeError as Error:
        Escribir_Mensaje(f"Audio omitido: {Error}")

    Ruta_Final = Renderizar_Video(Tutorial, Ruta_Crudo)
    Escribir_Mensaje(f"Video final generado: {Ruta_Final}")


def Crear_Parser() -> Argparse.ArgumentParser:

    """
    Crea el parser de linea de comandos.
    Define subcomandos separados para producir texto, capturar,
    generar voz, renderizar o ejecutar todo el pipeline.

    Parametros:
    - Ninguno.

    Retorna:
    - Argparse.ArgumentParser: Parser configurado para CLI.

    """

    Parser = Argparse.ArgumentParser(
        description = "Sistema propio de tutoriales de Semaplan."
    )
    Subparsers = Parser.add_subparsers(
        dest = "Comando",
        required = True,
    )

    for Nombre in ["texto", "capturar", "voz", "renderizar", "todo"]:
        Subparser = Subparsers.add_parser(Nombre)
        Subparser.add_argument("Tutorial")

        if Nombre == "renderizar":
            Subparser.add_argument("--crudo", default = "")

    return Parser


def Ejecutar_Cli() -> int:

    """
    Ejecuta el comando solicitado por terminal.
    Devuelve codigo cero si la operacion termina bien y codigo uno
    cuando ocurre un error controlado.

    Parametros:
    - Ninguno.

    Retorna:
    - int: Codigo de salida para el proceso.

    """

    Parser = Crear_Parser()
    Argumentos = Parser.parse_args()

    try:
        Ruta_Tutorial = Pathlib.Path(Argumentos.Tutorial)
        Tutorial = Cargar_Tutorial(Ruta_Tutorial)

        if Argumentos.Comando == "texto":
            Ruta_Texto = Generar_Tutorial_Texto(Tutorial)
            Escribir_Mensaje(f"Texto generado: {Ruta_Texto}")
            return 0

        if Argumentos.Comando == "capturar":
            Ruta_Crudo = Capturar_Video(Tutorial)
            Escribir_Mensaje(f"Video crudo generado: {Ruta_Crudo}")
            return 0

        if Argumentos.Comando == "voz":
            Ruta_Audio = Generar_Audio_Narracion(Tutorial)
            Escribir_Mensaje(f"Audio generado: {Ruta_Audio}")
            return 0

        if Argumentos.Comando == "renderizar":
            Ruta_Crudo = None

            if getattr(Argumentos, "crudo", ""):
                Ruta_Crudo = Pathlib.Path(Argumentos.crudo)

            Ruta_Final = Renderizar_Video(Tutorial, Ruta_Crudo)
            Escribir_Mensaje(f"Video final generado: {Ruta_Final}")
            return 0

        if Argumentos.Comando == "todo":
            Ejecutar_Todo(Tutorial)
            return 0

        Parser.error("Comando no reconocido.")
        return 1
    except Exception as Error:
        Escribir_Mensaje(f"Error: {Error}")
        return 1


if __name__ == "__main__":
    Sys.exit(Ejecutar_Cli())
