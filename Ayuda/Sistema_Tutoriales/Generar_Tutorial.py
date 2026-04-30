import argparse as Argparse
import array as Array
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
import wave as Wave


Ruta_Ayuda = Pathlib.Path(__file__).resolve().parents[1]
Ruta_Videos = Ruta_Ayuda / "Videos"
Ruta_Crudos = Ruta_Videos / "Crudos"
Ruta_Renderizados = Ruta_Videos / "Renderizados"
Ruta_Overlays = Ruta_Videos / "Overlays"
Ruta_Audios = Ruta_Videos / "Audio"
Ruta_Datos = Ruta_Videos / "Datos"
Ruta_Subtitulos = Ruta_Videos / "Subtitulos"
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
        Ruta_Subtitulos,
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

    if Obtener_Bandera(Tutorial, "Corregir_Tildes", True):
        Tutorial = Corregir_Tildes_Tutorial(Tutorial)

    Identificador = Obtener_Cadena(Tutorial, "Identificador")
    Titulo = Obtener_Cadena(Tutorial, "Titulo")

    if not Identificador:
        raise ValueError("Falta `Identificador` en el tutorial.")

    if not Titulo:
        raise ValueError("Falta `Titulo` en el tutorial.")

    return Tutorial


def Corregir_Tildes_Tutorial(
    Tutorial: dict[str, object],
) -> dict[str, object]:

    """
    Corrige tildes frecuentes en textos visibles del tutorial.
    La voz, los toasts y los subtitulos salen de esos textos; por
    eso se corrigen antes de generar cualquier artefacto.

    Parametros:
    - Tutorial: Contrato completo leido desde JSON.

    Retorna:
    - dict[str, object]: Contrato con textos editoriales corregidos.

    """

    return {
        Clave: Corregir_Tildes_Valor(Clave, Valor)
        for Clave, Valor in Tutorial.items()
    }


def Corregir_Tildes_Valor(
    Clave: str,
    Valor: object,
) -> object:

    """
    Recorre valores del contrato y corrige solo textos editoriales.
    Evita tocar selectores, codigo JavaScript, rutas, ids y valores
    tecnicos que deben mantenerse exactos para Playwright.

    Parametros:
    - Clave: Clave JSON del valor actual.
    - Valor: Valor heterogeneo leido desde el contrato.

    Retorna:
    - object: Valor corregido cuando corresponde.

    """

    Claves_Texto = {
        "Titulo",
        "Descripcion",
        "Descripcion_Corta",
        "Texto",
        "Cartel",
        "Titulo_Youtube",
    }
    Claves_Bloqueadas = {
        "Codigo",
        "Codigo_Lineas",
        "Selector",
        "Valor",
        "Url",
        "Storage_State",
        "Identificador",
        "Ruta",
    }

    if Clave in Claves_Bloqueadas:
        return Valor

    if isinstance(Valor, str):
        if Clave in Claves_Texto:
            return Corregir_Tildes_Texto(Valor)

        return Valor

    if isinstance(Valor, list):
        return [
            Corregir_Tildes_Valor(Clave, Elemento)
            for Elemento in Valor
        ]

    if isinstance(Valor, dict):
        return {
            Subclave: Corregir_Tildes_Valor(Subclave, Subvalor)
            for Subclave, Subvalor in Valor.items()
        }

    return Valor


def Corregir_Tildes_Texto(Texto: str) -> str:

    """
    Aplica reemplazos conservadores de palabras con tilde segura.
    No corrige palabras ambiguas como `esta`, `como` o `que`,
    porque pueden requerir o no tilde segun la frase.

    Parametros:
    - Texto: Texto visible que puede alimentar voz y subtitulos.

    Retorna:
    - str: Texto con tildes frecuentes corregidas.

    """

    Correcciones = {
        "accion": "acción",
        "acciones": "acciones",
        "ademas": "además",
        "ano": "año",
        "anios": "años",
        "baul": "baúl",
        "busqueda": "búsqueda",
        "categoria": "categoría",
        "categorias": "categorías",
        "clinica": "clínica",
        "descripcion": "descripción",
        "despues": "después",
        "estan": "están",
        "funcion": "función",
        "habito": "hábito",
        "habitos": "hábitos",
        "limite": "límite",
        "mas": "más",
        "medico": "médico",
        "medica": "médica",
        "numero": "número",
        "opcion": "opción",
        "opciones": "opciones",
        "periodo": "período",
        "periodos": "períodos",
        "podes": "podés",
        "proxima": "próxima",
        "proximas": "próximas",
        "proximo": "próximo",
        "proximos": "próximos",
        "rapida": "rápida",
        "rapido": "rápido",
        "seccion": "sección",
        "tambien": "también",
        "tenes": "tenés",
        "todavia": "todavía",
        "util": "útil",
    }

    Texto_Corregido = Texto

    for Sin_Tilde, Con_Tilde in Correcciones.items():
        Patron = Re.compile(
            rf"\b{Re.escape(Sin_Tilde)}\b",
            Re.IGNORECASE,
        )
        Texto_Corregido = Patron.sub(
            lambda Coincidencia: Aplicar_Mayusculas_Tilde(
                Coincidencia.group(0),
                Con_Tilde,
            ),
            Texto_Corregido,
        )

    return Texto_Corregido


def Aplicar_Mayusculas_Tilde(
    Original: str,
    Corregido: str,
) -> str:

    """
    Conserva el estilo de mayusculas al reemplazar una palabra.

    Parametros:
    - Original: Palabra encontrada en el contrato.
    - Corregido: Palabra con tilde correcta en minusculas.

    Retorna:
    - str: Palabra corregida con capitalizacion equivalente.

    """

    if Original.isupper():
        return Corregido.upper()

    if Original[:1].isupper():
        return Corregido[:1].upper() + Corregido[1:]

    return Corregido


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

    Texto_Narracion = Obtener_Texto_Audio_Tutorial(Tutorial)

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


def Obtener_Texto_Audio_Tutorial(
    Tutorial: dict[str, object],
) -> str:

    """
    Obtiene el texto unico que debe decir la voz del video.
    La prioridad son los carteles y toasts ya temporizados,
    porque son exactamente el texto visible para accesibilidad.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - str: Texto continuo para generar audio narrado.

    """

    Carteles = Obtener_Carteles_Consolidados(Tutorial)

    if Carteles:
        Partes = [
            str(Cartel["Texto"]).strip().rstrip(".") + "."
            for Cartel in Carteles
            if str(Cartel.get("Texto", "")).strip()
        ]
        return "\n\n".join(Partes)

    Narracion = Obtener_Lista_Diccionarios(Tutorial, "Narracion")
    return Obtener_Texto_Narracion(Narracion)


def Formatear_Tiempo_Srt(Segundos: float) -> str:

    """
    Formatea segundos como marca de tiempo SRT.
    El formato generado es HH:MM:SS,mmm y sirve para subir
    subtitulos junto al video en YouTube u otras plataformas.

    Parametros:
    - Segundos: Tiempo expresado en segundos desde el inicio.

    Retorna:
    - str: Tiempo compatible con archivos `.srt`.

    """

    Milisegundos_Totales = int(max(0.0, Segundos) * 1000)
    Horas = Milisegundos_Totales // 3600000
    Resto = Milisegundos_Totales % 3600000
    Minutos = Resto // 60000
    Resto = Resto % 60000
    Segundos_Enteros = Resto // 1000
    Milisegundos = Resto % 1000

    return (
        f"{Horas:02d}:{Minutos:02d}:"
        f"{Segundos_Enteros:02d},{Milisegundos:03d}"
    )


def Generar_Subtitulos(
    Tutorial: dict[str, object],
    Carteles: list[dict[str, object]],
) -> Pathlib.Path | None:

    """
    Genera subtitulos SRT desde los mismos carteles del video.
    Esta regla evita desalineaciones: lo que se oye, lo que se
    lee en pantalla y lo que se exporta como subtitulo sale de
    una unica fuente textual.

    Parametros:
    - Tutorial: Contrato completo del tutorial.
    - Carteles: Carteles y toasts temporizados del video.

    Retorna:
    - Pathlib.Path | None: Ruta SRT generada o None si no hay texto.

    """

    if not Carteles:
        return None

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Salida = Ruta_Subtitulos / f"{Identificador}.srt"
    Lineas: list[str] = []

    for Indice, Cartel in enumerate(Carteles, start = 1):
        Texto = str(Cartel.get("Texto", "")).strip()

        if not Texto:
            continue

        Inicio = Formatear_Tiempo_Srt(float(Cartel["Inicio"]))
        Fin = Formatear_Tiempo_Srt(float(Cartel["Fin"]))
        Lineas.append(str(Indice))
        Lineas.append(f"{Inicio} --> {Fin}")
        Lineas.append(Texto)
        Lineas.append("")

    Ruta_Salida.write_text("\n".join(Lineas), encoding = "utf-8")

    return Ruta_Salida


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

    Carteles_Ordenados = sorted(
        Carteles,
        key = lambda Elemento: Elemento["Inicio"],
    )
    return Ajustar_Solapes_Carteles(Carteles_Ordenados)


def Ajustar_Solapes_Carteles(
    Carteles: list[dict[str, object]],
) -> list[dict[str, object]]:

    """
    Recorta los carteles para que no se pisen en pantalla.
    El sistema usa una sola posicion visual para los toasts, por
    eso cuando dos tiempos se cruzan se corta el anterior antes
    de que empiece el siguiente.

    Parametros:
    - Carteles: Carteles normalizados y ordenados por inicio.

    Retorna:
    - list[dict[str, object]]: Carteles sin solapes visibles.

    """

    if len(Carteles) < 2:
        return Carteles

    Margen = 0.08
    Ajustados = [dict(Cartel) for Cartel in Carteles]

    for Indice in range(len(Ajustados) - 1):
        Actual = Ajustados[Indice]
        Siguiente = Ajustados[Indice + 1]
        Inicio = float(Actual["Inicio"])
        Fin = float(Actual["Fin"])
        Proximo_Inicio = float(Siguiente["Inicio"])

        if Fin <= Proximo_Inicio - Margen:
            continue

        Nuevo_Fin = max(Inicio + 0.15, Proximo_Inicio - Margen)
        Actual["Fin"] = round(Nuevo_Fin, 2)

    return [
        Cartel
        for Cartel in Ajustados
        if float(Cartel["Fin"]) > float(Cartel["Inicio"])
    ]


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
        "Tipo": Obtener_Cadena(Cartel, "Tipo_Cartel", "Toast"),
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
    Acciones_Preparacion = Obtener_Lista_Diccionarios(
        Tutorial,
        "Acciones_Preparacion",
    )
    Ancho, Alto = Obtener_Resolucion(Tutorial)
    Headless = Obtener_Bandera(Tutorial, "Headless", False)
    Ruta_Salida = Ruta_Crudos / f"{Identificador}.webm"
    Eventos: list[dict[str, object]] = []
    Eventos_Mouse: list[dict[str, object]] = []
    Estado_Mouse = {"X": 90.0, "Y": 90.0}

    if not Acciones:
        raise ValueError("El tutorial no tiene acciones para grabar.")

    with Iniciar_Playwright() as Playwright:
        Navegador = Playwright.chromium.launch(headless = Headless)
        Configuracion_Base: dict[str, object] = {
            "viewport": {"width": Ancho, "height": Alto},
        }
        Ruta_Storage_State = Resolver_Ruta_Opcional(
            Obtener_Cadena(Tutorial, "Storage_State")
        )

        if Ruta_Storage_State is not None:
            Configuracion_Base["storage_state"] = str(
                Ruta_Storage_State
            )

        Ruta_Storage_Preparada = Ejecutar_Acciones_Preparacion(
            Navegador,
            Configuracion_Base,
            Tutorial,
            Acciones_Preparacion,
        )

        Configuracion_Contexto = {
            **Configuracion_Base,
            "record_video_dir": str(Ruta_Crudos),
            "record_video_size": {"width": Ancho, "height": Alto},
        }

        if Ruta_Storage_Preparada is not None:
            Configuracion_Contexto["storage_state"] = str(
                Ruta_Storage_Preparada
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
            Ejecutar_Accion_Playwright(
                Pagina,
                Accion,
                Eventos_Mouse,
                Tiempo_Base,
                Estado_Mouse,
            )
            Pausar_Despues_De_Accion(Pagina, Accion, Tutorial)

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

    Ruta_Mouse = Ruta_Datos / f"{Identificador}_Cursor.json"
    Ruta_Mouse.write_text(
        Json.dumps(
            Eventos_Mouse,
            indent = 2,
            ensure_ascii = False,
        ) + "\n",
        encoding = "utf-8",
    )

    return Ruta_Salida


def Ejecutar_Acciones_Preparacion(
    Navegador: object,
    Configuracion_Base: dict[str, object],
    Tutorial: dict[str, object],
    Acciones_Preparacion: list[dict[str, object]],
) -> Pathlib.Path | None:

    """
    Ejecuta acciones previas sin grabarlas en el video.
    Esta fase sirve para cargar datos de ejemplo, limpiar
    residuos tecnicos y dejar la pantalla en un estado creible
    antes de iniciar la captura final.

    Parametros:
    - Navegador: Instancia de Chromium creada por Playwright.
    - Configuracion_Base: Opciones compartidas del contexto.
    - Tutorial: Contrato completo del tutorial.
    - Acciones_Preparacion: Acciones que preparan la escena.

    Retorna:
    - Pathlib.Path | None: Ruta del estado preparado, si existio.

    """

    if not Acciones_Preparacion:
        return None

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Storage_Preparada = (
        Ruta_Datos / f"{Identificador}_Storage_Preparado.json"
    )
    Contexto = Navegador.new_context(**Configuracion_Base)
    Pagina = Contexto.new_page()

    try:
        for Accion in Acciones_Preparacion:
            Ejecutar_Accion_Playwright(Pagina, Accion)
        Contexto.storage_state(path = str(Ruta_Storage_Preparada))
    finally:
        Contexto.close()

    return Ruta_Storage_Preparada


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
            "Tipo_Cartel": Obtener_Cadena(
                Accion,
                "Tipo_Cartel",
                "Toast",
            ),
            "Area": Accion.get("Area"),
        }
    )


def Pausar_Despues_De_Accion(
    Pagina: object,
    Accion: dict[str, object],
    Tutorial: dict[str, object],
) -> None:

    """
    Inserta una pausa didactica despues de cada accion explicada.
    Si la accion tiene cartel y no es una espera explicita, se
    deja respirar la pantalla para que el usuario pueda leer.

    Parametros:
    - Pagina: Pagina activa de Playwright.
    - Accion: Accion declarada en el tutorial.
    - Tutorial: Contrato completo para leer duraciones por defecto.

    Retorna:
    - None: Solo espera dentro del navegador.

    """

    Tipo = Obtener_Cadena(Accion, "Tipo").replace("-", "_").lower()
    Pausa = Obtener_Numero(Accion, "Pausa_Despues_Segundos", -1)

    if Pausa < 0:
        Tiene_Cartel = bool(Obtener_Cadena(Accion, "Cartel"))
        Es_Espera = Tipo in ["esperar", "pausa_manual"]

        if Tiene_Cartel and not Es_Espera:
            Factor = Obtener_Numero(
                Tutorial,
                "Pausa_Didactica_Factor",
                0.7,
            )
            Pausa_Maxima = Obtener_Numero(
                Tutorial,
                "Pausa_Didactica_Max_Segundos",
                4.5,
            )
            Pausa = min(
                Obtener_Numero(
                    Accion,
                    "Duracion_Cartel_Segundos",
                    Obtener_Numero(
                        Tutorial,
                        "Duracion_Cartel_Segundos",
                        5.0,
                    ),
                ) * Factor,
                Pausa_Maxima,
            )
        else:
            Pausa = 0

    if Pausa > 0:
        Pagina.wait_for_timeout(int(Pausa * 1000))


def Ejecutar_Accion_Playwright(
    Pagina: object,
    Accion: dict[str, object],
    Eventos_Mouse: list[dict[str, object]] | None = None,
    Tiempo_Base: float = 0.0,
    Estado_Mouse: dict[str, float] | None = None,
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
        Mover_Mouse_A_Selector(
            Pagina,
            Selector,
            Accion,
            Eventos_Mouse,
            Tiempo_Base,
            Estado_Mouse,
            True,
        )
        Pagina.locator(Selector).click()
        return

    if Tipo == "rellenar":
        Texto = Obtener_Cadena(Accion, "Texto")
        Mover_Mouse_A_Selector(
            Pagina,
            Selector,
            Accion,
            Eventos_Mouse,
            Tiempo_Base,
            Estado_Mouse,
            True,
        )
        Pagina.locator(Selector).fill(Texto)
        return

    if Tipo == "seleccionar":
        Valor = Obtener_Cadena(Accion, "Valor")
        Texto_Visible = Obtener_Cadena(Accion, "Texto")
        Mover_Mouse_A_Selector(
            Pagina,
            Selector,
            Accion,
            Eventos_Mouse,
            Tiempo_Base,
            Estado_Mouse,
            True,
        )
        if Texto_Visible:
            Pagina.evaluate(
                """
                (Datos) => {
                  const Select = document
                    .querySelector(Datos.Selector);
                  if (!Select) return;
                  const Opcion = Array.from(Select.options).find(
                    (Item) => Item.textContent.includes(Datos.Texto)
                  );
                  if (!Opcion) return;
                  Select.value = Opcion.value;
                  Select.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                }
                """,
                {"Selector": Selector, "Texto": Texto_Visible},
            )
            return

        Pagina.locator(Selector).select_option(Valor)
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
        Codigo = Obtener_Codigo_Accion(Accion)
        Pagina.wait_for_function(
            Codigo,
            timeout = int(
                Obtener_Numero(Accion, "Timeout_Ms", 120000)
            ),
        )
        return

    if Tipo == "hover":
        Mover_Mouse_A_Selector(
            Pagina,
            Selector,
            Accion,
            Eventos_Mouse,
            Tiempo_Base,
            Estado_Mouse,
            False,
        )
        Pagina.locator(Selector).hover()
        return

    if Tipo == "scroll":
        Pixeles_X = Obtener_Numero(Accion, "Pixeles_X", 0.0)
        Pixeles_Y = Obtener_Numero(Accion, "Pixeles_Y", 600.0)
        Pagina.mouse.wheel(Pixeles_X, Pixeles_Y)
        return

    if Tipo == "evaluar":
        Codigo = Obtener_Codigo_Accion(Accion)
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


def Obtener_Codigo_Accion(
    Accion: dict[str, object],
) -> str:

    """
    Obtiene codigo JavaScript desde una accion del contrato.
    Permite usar `Codigo` para piezas cortas o `Codigo_Lineas`
    para scripts largos y legibles dentro del JSON.

    Parametros:
    - Accion: Accion declarada en el contrato del tutorial.

    Retorna:
    - str: Codigo listo para entregar a Playwright.

    """

    Archivo_Codigo = Obtener_Cadena(Accion, "Archivo_Codigo")

    if Archivo_Codigo:
        Ruta_Codigo = Resolver_Ruta_Opcional(Archivo_Codigo)

        if not Ruta_Codigo or not Ruta_Codigo.exists():
            raise FileNotFoundError(
                f"No existe el archivo de codigo: {Archivo_Codigo}"
            )

        return Ruta_Codigo.read_text(encoding = "utf-8")

    Codigo = Obtener_Cadena(Accion, "Codigo")

    if Codigo:
        return Codigo

    Lineas = Accion.get("Codigo_Lineas", [])

    if not isinstance(Lineas, list):
        return ""

    return "\n".join(
        str(Linea)
        for Linea in Lineas
        if str(Linea).strip()
    )


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


def Mover_Mouse_A_Selector(
    Pagina: object,
    Selector: str,
    Accion: dict[str, object],
    Eventos_Mouse: list[dict[str, object]] | None,
    Tiempo_Base: float,
    Estado_Mouse: dict[str, float] | None,
    Es_Click: bool,
) -> None:

    """
    Registra y ejecuta un movimiento deliberado de mouse.
    Playwright no siempre deja visible el cursor en el video,
    por eso se guarda un evento para dibujar un cursor sintetico
    durante el render final.

    Parametros:
    - Pagina: Pagina activa de Playwright.
    - Selector: Selector CSS del destino.
    - Accion: Accion declarada en el tutorial.
    - Eventos_Mouse: Lista mutable de movimientos registrados.
    - Tiempo_Base: Momento base para calcular tiempos relativos.
    - Estado_Mouse: Ultima posicion conocida del cursor sintetico.
    - Es_Click: Indica si debe dibujarse pulso de click.

    Retorna:
    - None: Modifica la lista de eventos y mueve el mouse real.

    """

    if not Selector or Eventos_Mouse is None or Estado_Mouse is None:
        return

    if not Obtener_Bandera(Accion, "Mostrar_Mouse", True):
        return

    Localizador = Pagina.locator(Selector)
    Localizador.wait_for(state = "visible", timeout = 30000)
    Caja = Localizador.bounding_box()

    if Caja is None:
        return

    Destino_X = float(Caja["x"] + Caja["width"] / 2)
    Destino_Y = float(Caja["y"] + Caja["height"] / 2)
    Inicio = Time.perf_counter() - Tiempo_Base
    Duracion = Obtener_Numero(
        Accion,
        "Duracion_Mouse_Segundos",
        0.9,
    )

    Eventos_Mouse.append(
        {
            "Inicio": round(Inicio, 3),
            "Fin": round(Inicio + Duracion, 3),
            "Desde": [
                round(float(Estado_Mouse.get("X", 90.0)), 2),
                round(float(Estado_Mouse.get("Y", 90.0)), 2),
            ],
            "Hasta": [
                round(Destino_X, 2),
                round(Destino_Y, 2),
            ],
            "Click": Es_Click,
        }
    )

    Pagina.mouse.move(Destino_X, Destino_Y, steps = 18)
    Pagina.wait_for_timeout(int(Duracion * 1000))
    Estado_Mouse["X"] = Destino_X
    Estado_Mouse["Y"] = Destino_Y


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

    Voz = Tutorial.get("Voz", {})

    if not isinstance(Voz, dict):
        Voz = {}

    Proveedor = Obtener_Cadena(Voz, "Proveedor", "ElevenLabs")
    Texto = Obtener_Texto_Audio_Tutorial(Tutorial)
    Carteles = Obtener_Carteles_Consolidados(Tutorial)

    if not Texto:
        raise RuntimeError("El tutorial no tiene texto de narracion.")

    if Proveedor.lower() in ["windows", "local", "sapi"]:
        if Carteles and Obtener_Bandera(
            Voz,
            "Sincronizar_Carteles",
            True,
        ):
            return Generar_Audio_Windows_Sincronizado(
                Tutorial,
                Carteles,
                Voz,
            )

        Ruta_Windows = Generar_Audio_Windows(Tutorial, Texto, Voz)
        return Ajustar_Tempo_Audio(Ruta_Windows, Voz)

    Api_Key = Os.environ.get("ELEVENLABS_API_KEY", "").strip()
    Voz_Entorno = Os.environ.get("ELEVENLABS_VOICE_ID", "").strip()
    Voice_Id = Obtener_Cadena(Voz, "Elevenlabs_Voice_Id", Voz_Entorno)
    Modelo = Obtener_Cadena(Voz, "Modelo", "eleven_multilingual_v2")

    if not Api_Key:
        raise RuntimeError("Falta la variable ELEVENLABS_API_KEY.")

    if not Voice_Id:
        raise RuntimeError("Falta Elevenlabs_Voice_Id o entorno.")

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

    return Ajustar_Tempo_Audio(Ruta_Salida, Voz)


def Generar_Audio_Windows(
    Tutorial: dict[str, object],
    Texto: str,
    Voz: dict[str, object],
) -> Pathlib.Path:

    """
    Genera una narracion local con la voz instalada en Windows.
    Es un respaldo practico cuando no hay clave de ElevenLabs y
    alcanza para producir borradores accesibles con audio real.

    Parametros:
    - Tutorial: Contrato completo del tutorial.
    - Texto: Texto unico que debe decir la voz.
    - Voz: Configuracion de voz declarada en el contrato.

    Retorna:
    - Pathlib.Path: Ruta del archivo WAV generado.

    """

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Audio = Ruta_Audios / f"{Identificador}.wav"

    return Generar_Audio_Windows_Archivo(
        Identificador,
        Texto,
        Voz,
        Ruta_Audio,
        "Narracion",
    )


def Generar_Audio_Windows_Sincronizado(
    Tutorial: dict[str, object],
    Carteles: list[dict[str, object]],
    Voz: dict[str, object],
) -> Pathlib.Path:

    """
    Genera una pista WAV con la voz alineada a cada cartel.
    Cada texto visible se sintetiza por separado y se coloca en
    el mismo segundo en que aparece su toast, evitando que una
    narracion corrida se adelante o atrase frente al mouse.

    Parametros:
    - Tutorial: Contrato completo del tutorial.
    - Carteles: Carteles ya ordenados y sin solapes visuales.
    - Voz: Configuracion de voz declarada en el contrato.

    Retorna:
    - Pathlib.Path: Ruta del WAV sincronizado generado.

    """

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Salida = Ruta_Audios / f"{Identificador}.wav"
    Segmentos: list[dict[str, object]] = []
    Tempo_Base = Obtener_Numero(Voz, "Tempo", 1.0)

    for Indice, Cartel in enumerate(Carteles, start = 1):
        Texto = str(Cartel.get("Texto", "")).strip()

        if not Texto:
            continue

        Inicio = float(Cartel["Inicio"])
        Fin = float(Cartel["Fin"])
        Espacio = max(0.5, Fin - Inicio)
        Sufijo = f"Audio_Segmento_{Indice:03d}"
        Ruta_Segmento = Ruta_Datos / f"{Identificador}_{Sufijo}.wav"
        Ruta_Segmento = Generar_Audio_Windows_Archivo(
            Identificador,
            Texto,
            Voz,
            Ruta_Segmento,
            Sufijo,
        )
        Tempo_Efectivo = Calcular_Tempo_Segmento(
            Ruta_Segmento,
            Tempo_Base,
            Espacio,
        )
        Ajustar_Tempo_Audio_Valor(Ruta_Segmento, Tempo_Efectivo)
        Duracion = Obtener_Duracion_Wav(Ruta_Segmento)
        Segmentos.append(
            {
                "Indice": Indice,
                "Inicio": Inicio,
                "Fin": Fin,
                "Duracion": Duracion,
                "Tempo": Tempo_Efectivo,
                "Texto": Texto,
                "Ruta": str(Ruta_Segmento),
            }
        )

    if not Segmentos:
        raise RuntimeError(
            "No hay carteles con texto para sincronizar audio."
        )

    Mezclar_Audio_Segmentos(Ruta_Salida, Segmentos)
    Validar_Audio_Wav_Audible(Ruta_Salida)
    Guardar_Manifiesto_Audio_Segmentado(Identificador, Segmentos)

    return Ruta_Salida


def Generar_Audio_Windows_Archivo(
    Identificador: str,
    Texto: str,
    Voz: dict[str, object],
    Ruta_Audio: Pathlib.Path,
    Sufijo: str,
) -> Pathlib.Path:

    """
    Sintetiza un archivo WAV con la voz local de Windows.
    La funcion se usa tanto para narraciones completas como para
    segmentos breves ubicados luego en la linea de tiempo.

    Parametros:
    - Identificador: Nombre estable del tutorial.
    - Texto: Texto que debe decir la voz.
    - Voz: Configuracion de voz declarada en el contrato.
    - Ruta_Audio: Destino del WAV generado.
    - Sufijo: Sufijo de archivos auxiliares.

    Retorna:
    - Pathlib.Path: Ruta del WAV generado.

    """

    Ruta_Texto = Ruta_Datos / f"{Identificador}_{Sufijo}.txt"
    Ruta_Script = Ruta_Datos / f"{Identificador}_Voz_Windows.ps1"
    Velocidad = int(Obtener_Numero(Voz, "Velocidad", -1))
    Volumen = int(Obtener_Numero(Voz, "Volumen", 100))
    Nombre_Voz = Obtener_Cadena(Voz, "Windows_Voz")
    Script = """
param(
  [string]$Ruta_Texto,
  [string]$Ruta_Audio,
  [int]$Velocidad,
  [int]$Volumen,
  [string]$Nombre_Voz
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech
$Texto = Get-Content -Raw -Encoding UTF8 -LiteralPath $Ruta_Texto
$Partes = $Texto -split "(\\r?\\n){2,}" | Where-Object {
  $_.Trim()
}
$Sintetizador = New-Object System.Speech.Synthesis.SpeechSynthesizer
if ($Nombre_Voz) {
  $Sintetizador.SelectVoice($Nombre_Voz)
}
$Sintetizador.Rate = $Velocidad
$Sintetizador.Volume = $Volumen
$Sintetizador.SetOutputToWaveFile($Ruta_Audio)
foreach ($Parte in $Partes) {
  $Sintetizador.Speak($Parte.Trim())
}
$Sintetizador.Dispose()
"""

    Ruta_Texto.write_text(Texto, encoding = "utf-8")
    Ruta_Script.write_text(Script.strip() + "\n", encoding = "utf-8")
    Resultado = Subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(Ruta_Script),
            "-Ruta_Texto",
            str(Ruta_Texto),
            "-Ruta_Audio",
            str(Ruta_Audio),
            "-Velocidad",
            str(Velocidad),
            "-Volumen",
            str(Volumen),
            "-Nombre_Voz",
            Nombre_Voz,
        ],
        capture_output = True,
        text = True,
    )

    if Resultado.returncode != 0:
        Detalle = (Resultado.stderr or Resultado.stdout or "").strip()
        raise RuntimeError(f"Fallo voz local Windows: {Detalle}")

    Validar_Audio_Wav_Audible(Ruta_Audio)
    return Ruta_Audio


def Calcular_Tempo_Segmento(
    Ruta_Audio: Pathlib.Path,
    Tempo_Base: float,
    Espacio_Segundos: float,
) -> float:

    """
    Calcula el tempo que permite que una frase entre en su cartel.
    Respeta el tempo lento pedido cuando entra en ventana; si no,
    acelera solo lo necesario para que el audio no se pise con el
    siguiente cartel.

    Parametros:
    - Ruta_Audio: Segmento recien sintetizado.
    - Tempo_Base: Tempo preferido para la voz.
    - Espacio_Segundos: Ventana disponible del cartel.

    Retorna:
    - float: Factor de tempo final para el segmento.

    """

    if Tempo_Base <= 0:
        Tempo_Base = 1.0

    Duracion_Original = Obtener_Duracion_Wav(Ruta_Audio)

    if Duracion_Original <= 0:
        return Tempo_Base

    Duracion_Pedida = Duracion_Original / Tempo_Base

    if Duracion_Pedida <= Espacio_Segundos:
        return Tempo_Base

    return max(Tempo_Base, Duracion_Original / Espacio_Segundos)


def Guardar_Manifiesto_Audio_Segmentado(
    Identificador: str,
    Segmentos: list[dict[str, object]],
) -> None:

    """
    Guarda un manifiesto para auditar la sincronizacion de voz.
    Permite revisar rapidamente que cada texto, inicio y duracion
    coincidan con los carteles renderizados.

    Parametros:
    - Identificador: Nombre estable del tutorial.
    - Segmentos: Segmentos de audio ya ubicados en tiempo.

    Retorna:
    - None: Escribe un JSON auxiliar.

    """

    Ruta_Manifiesto = (
        Ruta_Datos / f"{Identificador}_Audio_Segmentos.json"
    )
    Ruta_Manifiesto.write_text(
        Json.dumps(Segmentos, ensure_ascii = False, indent = 2),
        encoding = "utf-8",
    )


def Obtener_Duracion_Wav(
    Ruta_Audio: Pathlib.Path,
) -> float:

    """
    Obtiene la duracion de un archivo WAV.

    Parametros:
    - Ruta_Audio: Archivo WAV a medir.

    Retorna:
    - float: Duracion en segundos.

    """

    with Wave.open(str(Ruta_Audio), "rb") as Archivo:
        Frames = Archivo.getnframes()
        Frecuencia = Archivo.getframerate()

    if Frecuencia <= 0:
        return 0.0

    return Frames / Frecuencia


def Leer_Wav_Mono_16(
    Ruta_Audio: Pathlib.Path,
) -> tuple[int, Array.array]:

    """
    Lee un WAV PCM de 16 bits y lo devuelve como senal mono.

    Parametros:
    - Ruta_Audio: Archivo WAV a leer.

    Retorna:
    - tuple[int, Array.array]: Frecuencia y muestras mono.

    """

    with Wave.open(str(Ruta_Audio), "rb") as Archivo:
        Canales = Archivo.getnchannels()
        Frecuencia = Archivo.getframerate()
        Ancho_Muestra = Archivo.getsampwidth()
        Frames = Archivo.readframes(Archivo.getnframes())

    if Ancho_Muestra != 2:
        raise RuntimeError(
            "El audio sincronizado requiere WAV PCM de 16 bits."
        )

    Muestras = Array.array("h")
    Muestras.frombytes(Frames)

    if Sys.byteorder != "little":
        Muestras.byteswap()

    if Canales == 1:
        return Frecuencia, Muestras

    Mono = Array.array("h")

    for Indice in range(0, len(Muestras), Canales):
        Ventana = Muestras[Indice:Indice + Canales]
        Promedio = sum(Ventana) / len(Ventana)
        Mono.append(int(Promedio))

    return Frecuencia, Mono


def Escribir_Wav_Mono_16(
    Ruta_Audio: Pathlib.Path,
    Frecuencia: int,
    Muestras: Array.array,
) -> None:

    """
    Escribe un WAV mono PCM de 16 bits.

    Parametros:
    - Ruta_Audio: Archivo de salida.
    - Frecuencia: Frecuencia de muestreo.
    - Muestras: Muestras de audio ya recortadas a int16.

    Retorna:
    - None: Escribe el archivo en disco.

    """

    Salida = Array.array("h", Muestras)

    if Sys.byteorder != "little":
        Salida.byteswap()

    with Wave.open(str(Ruta_Audio), "wb") as Archivo:
        Archivo.setnchannels(1)
        Archivo.setsampwidth(2)
        Archivo.setframerate(Frecuencia)
        Archivo.writeframes(Salida.tobytes())


def Mezclar_Audio_Segmentos(
    Ruta_Salida: Pathlib.Path,
    Segmentos: list[dict[str, object]],
) -> None:

    """
    Mezcla segmentos de voz ubicandolos en su segundo exacto.

    Parametros:
    - Ruta_Salida: Archivo WAV final.
    - Segmentos: Segmentos con ruta e inicio en segundos.

    Retorna:
    - None: Escribe el WAV mezclado.

    """

    Frecuencia_Final: int | None = None
    Mezcla = Array.array("i")

    for Segmento in Segmentos:
        Ruta = Pathlib.Path(str(Segmento["Ruta"]))
        Inicio = float(Segmento["Inicio"])
        Frecuencia, Muestras = Leer_Wav_Mono_16(Ruta)

        if Frecuencia_Final is None:
            Frecuencia_Final = Frecuencia
        elif Frecuencia != Frecuencia_Final:
            raise RuntimeError(
                "Los segmentos de voz no tienen la misma frecuencia."
            )

        Desplazamiento = max(
            0,
            int(round(Inicio * Frecuencia_Final)),
        )
        Largo_Necesario = Desplazamiento + len(Muestras)

        if len(Mezcla) < Largo_Necesario:
            Mezcla.extend([0] * (Largo_Necesario - len(Mezcla)))

        for Indice, Muestra in enumerate(Muestras):
            Mezcla[Desplazamiento + Indice] += int(Muestra)

    if Frecuencia_Final is None:
        raise RuntimeError(
            "No se pudieron mezclar segmentos de audio."
        )

    Salida = Array.array("h")

    for Muestra in Mezcla:
        Salida.append(max(-32768, min(32767, Muestra)))

    Escribir_Wav_Mono_16(Ruta_Salida, Frecuencia_Final, Salida)


def Validar_Audio_Wav_Audible(
    Ruta_Audio: Pathlib.Path,
) -> None:

    """
    Valida que un WAV tenga senal audible y no sea silencio.
    La voz local de Windows puede crear archivos validos pero
    mudos cuando recibe textos largos de una sola vez; este
    control evita publicar un MP4 con pista silenciosa.

    Parametros:
    - Ruta_Audio: Archivo WAV que debe revisarse.

    Retorna:
    - None: Lanza RuntimeError si el audio parece silencioso.

    """

    with Wave.open(str(Ruta_Audio), "rb") as Archivo:
        Frames = Archivo.readframes(Archivo.getnframes())
        Ancho_Muestra = Archivo.getsampwidth()

    if Ancho_Muestra != 2 or not Frames:
        return

    Muestras = Array.array("h")
    Muestras.frombytes(Frames)

    if Sys.byteorder != "little":
        Muestras.byteswap()

    Pico = max((abs(Muestra) for Muestra in Muestras), default = 0)

    if Pico < 500:
        raise RuntimeError(
            "La voz local genero un WAV sin volumen audible."
        )


def Ajustar_Tempo_Audio(
    Ruta_Audio: Pathlib.Path,
    Voz: dict[str, object],
) -> Pathlib.Path:

    """
    Ajusta el tempo final de una narracion ya generada.
    Algunas voces locales no respetan bien la velocidad pedida;
    este paso permite ralentizar o acelerar el audio de forma
    reproducible con FFmpeg.

    Parametros:
    - Ruta_Audio: Archivo de audio generado.
    - Voz: Configuracion de voz declarada en el contrato.

    Retorna:
    - Pathlib.Path: Ruta del audio ajustado.

    """

    Tempo = Obtener_Numero(Voz, "Tempo", 1.0)
    return Ajustar_Tempo_Audio_Valor(Ruta_Audio, Tempo)


def Ajustar_Tempo_Audio_Valor(
    Ruta_Audio: Pathlib.Path,
    Tempo: float,
) -> Pathlib.Path:

    """
    Aplica un factor de tempo concreto sobre un archivo de audio.

    Parametros:
    - Ruta_Audio: Archivo de audio generado.
    - Tempo: Factor final de tempo. Menor que 1 ralentiza.

    Retorna:
    - Pathlib.Path: Ruta del audio ajustado.

    """

    if Tempo <= 0 or 0.99 <= Tempo <= 1.01:
        return Ruta_Audio

    Ruta_Temporal = Ruta_Audio.with_name(
        f"{Ruta_Audio.stem}_Tempo{Ruta_Audio.suffix}"
    )
    Comando = [
        Buscar_Ffmpeg(),
        "-y",
        "-i",
        str(Ruta_Audio),
        "-filter:a",
        Construir_Filtro_Atempo(Tempo),
        str(Ruta_Temporal),
    ]
    Ejecutar_Ffmpeg(Comando)
    Shutil.move(str(Ruta_Temporal), str(Ruta_Audio))
    return Ruta_Audio


def Construir_Filtro_Atempo(
    Tempo: float,
) -> str:

    """
    Construye una cadena `atempo` valida para FFmpeg.
    El filtro acepta factores entre 0.5 y 2.0, por eso los
    valores fuera de ese rango se encadenan en varios pasos.

    Parametros:
    - Tempo: Factor de tempo final. Menor que 1 ralentiza.

    Retorna:
    - str: Filtro de audio compatible con FFmpeg.

    """

    Factores: list[float] = []
    Valor = float(Tempo)

    while Valor < 0.5:
        Factores.append(0.5)
        Valor = Valor / 0.5

    while Valor > 2.0:
        Factores.append(2.0)
        Valor = Valor / 2.0

    Factores.append(Valor)

    return ",".join(
        f"atempo={Factor:.4f}".rstrip("0").rstrip(".")
        for Factor in Factores
    )


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
    Ruta_Audio = Obtener_Ruta_Audio_Disponible(Identificador)
    Ruta_Salida = Ruta_Renderizados / f"{Identificador}.mp4"
    Carteles = Obtener_Carteles_Consolidados(Tutorial)
    Generar_Subtitulos(Tutorial, Carteles)
    Duracion_Video = Obtener_Duracion_Video(Ruta_Ffmpeg, Ruta_Crudo)
    Ruta_Capa_Dinamica = Crear_Capa_Dinamica_Video(
        Tutorial,
        Ruta_Ffmpeg,
        Duracion_Video,
        Carteles,
    )
    Overlays = []
    Carteles_Estaticos = []

    if Ruta_Capa_Dinamica is None:
        Overlays = Crear_Overlays(Tutorial, Carteles)
        Carteles_Estaticos = Carteles

    Comando = Construir_Comando_Ffmpeg(
        Ruta_Ffmpeg,
        Ruta_Crudo,
        Ruta_Salida,
        Overlays,
        Carteles_Estaticos,
        Ruta_Audio,
        Duracion_Video,
        Ruta_Capa_Dinamica,
    )

    Ejecutar_Ffmpeg(Comando)

    return Ruta_Salida


def Obtener_Ruta_Audio_Disponible(
    Identificador: str,
) -> Pathlib.Path | None:

    """
    Busca audio generado para un tutorial.
    Acepta MP3 de ElevenLabs y WAV de voz local Windows, dejando
    el render sin audio cuando no existe ninguna pista.

    Parametros:
    - Identificador: Identificador estable del tutorial.

    Retorna:
    - Pathlib.Path | None: Ruta de audio o None si no existe.

    """

    for Extension in ["mp3", "wav", "m4a"]:
        Ruta = Ruta_Audios / f"{Identificador}.{Extension}"

        if Ruta.exists():
            return Ruta

    return None


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
    Fuente = Cargar_Fuente(Imagen_Fuente, 32)
    Fuente_Chica = Cargar_Fuente(Imagen_Fuente, 26)
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


def Crear_Cursor_Video(
    Tutorial: dict[str, object],
    Ruta_Ffmpeg: str,
    Duracion_Video: float | None,
) -> Pathlib.Path | None:

    """
    Crea un video transparente con cursor sintetico visible.
    Se renderiza desde los eventos de mouse capturados durante
    Playwright para que el usuario vea hacia donde va cada accion.

    Parametros:
    - Tutorial: Contrato completo del tutorial.
    - Ruta_Ffmpeg: Ejecutable de FFmpeg disponible.
    - Duracion_Video: Duracion del video base.

    Retorna:
    - Pathlib.Path | None: Video transparente del cursor o None.

    """

    Eventos_Mouse = Cargar_Eventos_Mouse(Tutorial)

    if not Eventos_Mouse or Duracion_Video is None:
        return None

    try:
        from PIL import Image as Imagen
        from PIL import ImageDraw as Imagen_Dibujo
    except ImportError as Error:
        raise RuntimeError(
            "Falta Pillow para crear cursor."
        ) from Error

    Identificador = Obtener_Identificador(Tutorial)
    Ancho, Alto = Obtener_Resolucion(Tutorial)
    Fps = int(Obtener_Numero(Tutorial, "Cursor_Fps", 12))
    Ruta_Cursor = Ruta_Datos / f"{Identificador}_Cursor.mov"
    Comando = [
        Ruta_Ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgba",
        "-s",
        f"{Ancho}x{Alto}",
        "-r",
        str(Fps),
        "-i",
        "-",
        "-an",
        "-c:v",
        "qtrle",
        str(Ruta_Cursor),
    ]
    Proceso = Subprocess.Popen(
        Comando,
        stdin = Subprocess.PIPE,
        stderr = Subprocess.PIPE,
    )

    if Proceso.stdin is None:
        return None

    Cantidad_Frames = int(Duracion_Video * Fps) + 1

    for Indice in range(Cantidad_Frames):
        Segundo = Indice / Fps
        Posicion, Pulso = Calcular_Estado_Cursor(
            Eventos_Mouse,
            Segundo,
        )
        Frame = Imagen.new("RGBA", (Ancho, Alto), (0, 0, 0, 0))
        Dibujo = Imagen_Dibujo.Draw(Frame)
        Dibujar_Cursor_Sintetico(Dibujo, Posicion, Pulso)
        Proceso.stdin.write(Frame.tobytes())

    Proceso.stdin.close()
    Codigo = Proceso.wait()

    if Codigo != 0:
        Error_Texto = b""

        if Proceso.stderr is not None:
            Error_Texto = Proceso.stderr.read()

        raise RuntimeError(
            "FFmpeg no pudo crear el cursor: "
            + Error_Texto.decode("utf-8", errors = "ignore")
        )

    return Ruta_Cursor


def Crear_Capa_Dinamica_Video(
    Tutorial: dict[str, object],
    Ruta_Ffmpeg: str,
    Duracion_Video: float | None,
    Carteles: list[dict[str, object]],
) -> Pathlib.Path | None:

    """
    Crea una sola capa transparente con toasts, resaltados y cursor.
    Evita encadenar decenas de imagenes PNG en FFmpeg, algo que en
    videos largos puede consumir demasiada memoria.

    Parametros:
    - Tutorial: Contrato completo del tutorial.
    - Ruta_Ffmpeg: Ejecutable de FFmpeg disponible.
    - Duracion_Video: Duracion del video base.
    - Carteles: Carteles y toasts temporizados.

    Retorna:
    - Pathlib.Path | None: Ruta de la capa transparente o None.

    """

    Eventos_Mouse = Cargar_Eventos_Mouse(Tutorial)

    if Duracion_Video is None:
        return None

    if not Eventos_Mouse and not Carteles:
        return None

    try:
        from PIL import Image as Imagen
        from PIL import ImageDraw as Imagen_Dibujo
        from PIL import ImageFont as Imagen_Fuente
    except ImportError as Error:
        raise RuntimeError(
            "Falta Pillow para crear capa dinamica."
        ) from Error

    Identificador = Obtener_Identificador(Tutorial)
    Ancho, Alto = Obtener_Resolucion(Tutorial)
    Fps = int(Obtener_Numero(Tutorial, "Cursor_Fps", 12))
    Fuente = Cargar_Fuente(Imagen_Fuente, 32)
    Fuente_Chica = Cargar_Fuente(Imagen_Fuente, 26)
    Ruta_Capa = Ruta_Datos / f"{Identificador}_Capa_Dinamica.mov"
    Proceso = Abrir_Ffmpeg_Capa(
        Ruta_Ffmpeg,
        Ruta_Capa,
        Ancho,
        Alto,
        Fps,
    )

    if Proceso.stdin is None:
        return None

    Cantidad_Frames = int(Duracion_Video * Fps) + 1

    for Indice in range(Cantidad_Frames):
        Segundo = Indice / Fps
        Frame = Imagen.new("RGBA", (Ancho, Alto), (0, 0, 0, 0))
        Dibujo = Imagen_Dibujo.Draw(Frame)

        for Cartel in Carteles:
            Inicio = float(Cartel["Inicio"])
            Fin = float(Cartel["Fin"])

            if Inicio <= Segundo <= Fin:
                Dibujar_Area(Dibujo, Cartel)
                Dibujar_Caja_Texto(
                    Dibujo,
                    Cartel,
                    Ancho,
                    Alto,
                    Fuente,
                    Fuente_Chica,
                )

        if Eventos_Mouse:
            Posicion, Pulso = Calcular_Estado_Cursor(
                Eventos_Mouse,
                Segundo,
            )
            Dibujar_Cursor_Sintetico(Dibujo, Posicion, Pulso)

        Proceso.stdin.write(Frame.tobytes())

    Proceso.stdin.close()
    Codigo = Proceso.wait()

    if Codigo != 0:
        Error_Texto = b""

        if Proceso.stderr is not None:
            Error_Texto = Proceso.stderr.read()

        raise RuntimeError(
            "FFmpeg no pudo crear la capa dinamica: "
            + Error_Texto.decode("utf-8", errors = "ignore")
        )

    return Ruta_Capa


def Abrir_Ffmpeg_Capa(
    Ruta_Ffmpeg: str,
    Ruta_Capa: Pathlib.Path,
    Ancho: int,
    Alto: int,
    Fps: int,
) -> Subprocess.Popen:

    """
    Abre un proceso FFmpeg preparado para recibir frames RGBA.
    La salida usa `qtrle` en MOV porque conserva transparencia y
    funciona bien como una unica capa superpuesta.

    Parametros:
    - Ruta_Ffmpeg: Ejecutable de FFmpeg disponible.
    - Ruta_Capa: Ruta de salida de la capa transparente.
    - Ancho: Ancho del video.
    - Alto: Alto del video.
    - Fps: Cuadros por segundo de la capa.

    Retorna:
    - Subprocess.Popen: Proceso con stdin abierto para frames.

    """

    Comando = [
        Ruta_Ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgba",
        "-s",
        f"{Ancho}x{Alto}",
        "-r",
        str(Fps),
        "-i",
        "-",
        "-an",
        "-c:v",
        "qtrle",
        str(Ruta_Capa),
    ]

    return Subprocess.Popen(
        Comando,
        stdin = Subprocess.PIPE,
        stderr = Subprocess.PIPE,
    )


def Cargar_Eventos_Mouse(
    Tutorial: dict[str, object],
) -> list[dict[str, object]]:

    """
    Carga los eventos de mouse generados durante una captura.
    Si el tutorial aun no fue capturado, devuelve una lista vacia
    y el render continua sin cursor sintetico.

    Parametros:
    - Tutorial: Contrato completo del tutorial.

    Retorna:
    - list[dict[str, object]]: Eventos de movimiento y click.

    """

    Identificador = Obtener_Identificador(Tutorial)
    Ruta_Mouse = Ruta_Datos / f"{Identificador}_Cursor.json"

    if not Ruta_Mouse.exists():
        return []

    try:
        Datos = Json.loads(Ruta_Mouse.read_text(encoding = "utf-8"))
    except Json.JSONDecodeError:
        return []

    if not isinstance(Datos, list):
        return []

    return [Evento for Evento in Datos if isinstance(Evento, dict)]


def Calcular_Estado_Cursor(
    Eventos_Mouse: list[dict[str, object]],
    Segundo: float,
) -> tuple[tuple[float, float], bool]:

    """
    Calcula la posicion del cursor para un instante del video.
    Interpola entre origen y destino de cada movimiento y activa
    un pulso breve cuando el evento representa un click.

    Parametros:
    - Eventos_Mouse: Eventos generados durante la captura.
    - Segundo: Tiempo del frame actual.

    Retorna:
    - tuple[tuple[float, float], bool]: Posicion y pulso activo.

    """

    Posicion = (90.0, 90.0)
    Pulso = False

    for Evento in Eventos_Mouse:
        Inicio = Obtener_Numero(Evento, "Inicio", 0.0)
        Fin = Obtener_Numero(Evento, "Fin", Inicio)
        Desde = Evento.get("Desde", [Posicion[0], Posicion[1]])
        Hasta = Evento.get("Hasta", [Posicion[0], Posicion[1]])

        if not isinstance(Desde, list) or not isinstance(Hasta, list):
            continue

        if len(Desde) != 2 or len(Hasta) != 2:
            continue

        Desde_X, Desde_Y = float(Desde[0]), float(Desde[1])
        Hasta_X, Hasta_Y = float(Hasta[0]), float(Hasta[1])

        if Segundo < Inicio:
            break

        if Inicio <= Segundo <= Fin and Fin > Inicio:
            Progreso = (Segundo - Inicio) / (Fin - Inicio)
            Progreso = max(0.0, min(1.0, Progreso))
            Suave = Progreso * Progreso * (3 - 2 * Progreso)
            X = Desde_X + (Hasta_X - Desde_X) * Suave
            Y = Desde_Y + (Hasta_Y - Desde_Y) * Suave
            Pulso = False
            return (X, Y), Pulso

        Posicion = (Hasta_X, Hasta_Y)
        Es_Click = bool(Evento.get("Click", False))

        if Es_Click and Fin <= Segundo <= Fin + 0.45:
            Pulso = True

    return Posicion, Pulso


def Dibujar_Cursor_Sintetico(
    Dibujo: object,
    Posicion: tuple[float, float],
    Pulso: bool,
) -> None:

    """
    Dibuja un cursor visible con sombra y pulso de click.
    El estilo busca ser claro sobre fondos claros u oscuros sin
    tapar demasiado la interfaz que se esta explicando.

    Parametros:
    - Dibujo: Objeto ImageDraw de Pillow.
    - Posicion: Coordenadas del cursor.
    - Pulso: Indica si debe mostrarse feedback de click.

    Retorna:
    - None: Dibuja directamente sobre el frame transparente.

    """

    X, Y = Posicion
    Puntos = [
        (X, Y),
        (X + 5, Y + 34),
        (X + 15, Y + 25),
        (X + 23, Y + 45),
        (X + 33, Y + 41),
        (X + 24, Y + 22),
        (X + 38, Y + 21),
    ]
    Sombra = [
        (Punto_X + 3, Punto_Y + 4)
        for Punto_X, Punto_Y in Puntos
    ]

    if Pulso:
        Dibujo.ellipse(
            [X - 22, Y - 22, X + 44, Y + 44],
            outline = (18, 119, 103, 190),
            width = 5,
        )

    Dibujo.polygon(Sombra, fill = (0, 0, 0, 120))
    Dibujo.polygon(Puntos, fill = (255, 255, 255, 255))
    Dibujo.line(
        Puntos + [Puntos[0]],
        fill = (17, 24, 39, 255),
        width = 3,
        joint = "curve",
    )


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
    Tipo = str(Cartel.get("Tipo", "Toast")).lower()
    Es_Intro = Tipo == "intro"
    Ancho_Texto_Maximo = 62 if Es_Intro else 58
    Fuente_Usada = Fuente if len(Texto) <= 120 else Fuente_Chica
    Texto_Envuelto = "\n".join(
        Textwrap.wrap(Texto, width = Ancho_Texto_Maximo)
    )
    Caja_Texto = Dibujo.multiline_textbbox(
        (0, 0),
        Texto_Envuelto,
        font = Fuente_Usada,
        spacing = 9,
    )
    Ancho_Texto = Caja_Texto[2] - Caja_Texto[0]
    Alto_Texto = Caja_Texto[3] - Caja_Texto[1]
    Margen = 56
    Relleno_X = 36 if Es_Intro else 24
    Relleno_Y = 28 if Es_Intro else 18
    Ancho_Maximo = int(Ancho * 0.52)

    if Es_Intro:
        Ancho_Maximo = int(Ancho * 0.66)

    Ancho_Caja = min(Ancho_Maximo, Ancho_Texto + Relleno_X * 2)
    Alto_Caja = Alto_Texto + Relleno_Y * 2
    Posicion = str(Cartel.get("Posicion", "Inferior")).lower()
    X = Margen
    Y = Alto - Alto_Caja - Margen

    if Es_Intro:
        X = int((Ancho - Ancho_Caja) / 2)
        Y = int((Alto - Alto_Caja) / 2)
    elif Posicion == "superior":
        X = int((Ancho - Ancho_Caja) / 2)
        Y = Margen
    elif Posicion == "centro":
        X = int((Ancho - Ancho_Caja) / 2)
        Y = int((Alto - Alto_Caja) / 2)
    elif Posicion == "izquierda":
        X = Margen
        Y = int((Alto - Alto_Caja) / 2)
    elif Posicion == "derecha":
        X = Ancho - Ancho_Caja - Margen
        Y = int((Alto - Alto_Caja) / 2)

    Dibujo.rounded_rectangle(
        [X, Y, X + Ancho_Caja, Y + Alto_Caja],
        radius = 16 if Es_Intro else 10,
        fill = (22, 28, 34, 230),
        outline = (18, 119, 103, 145),
        width = 1,
    )

    Dibujo.multiline_text(
        (X + Relleno_X, Y + Relleno_Y),
        Texto_Envuelto,
        font = Fuente_Usada,
        fill = (255, 255, 255, 255),
        spacing = 9,
    )


def Construir_Comando_Ffmpeg(
    Ruta_Ffmpeg: str,
    Ruta_Crudo: Pathlib.Path,
    Ruta_Salida: Pathlib.Path,
    Overlays: list[Pathlib.Path],
    Carteles: list[dict[str, object]],
    Ruta_Audio: Pathlib.Path | None,
    Duracion_Video: float | None,
    Ruta_Cursor: Pathlib.Path | None,
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
    - Ruta_Cursor: Video transparente con cursor sintetico.

    Retorna:
    - list[str]: Argumentos listos para Subprocess.run.

    """

    Comando = [Ruta_Ffmpeg, "-y", "-i", str(Ruta_Crudo)]

    for Ruta_Overlay in Overlays:
        Comando.extend(["-loop", "1", "-i", str(Ruta_Overlay)])

    Indice_Cursor = 1 + len(Overlays)

    if Ruta_Cursor is not None:
        Comando.extend(["-i", str(Ruta_Cursor)])

    Indice_Audio = 1 + len(Overlays)

    if Ruta_Cursor is not None:
        Indice_Audio += 1

    if Ruta_Audio is not None:
        Comando.extend(["-i", str(Ruta_Audio)])

    if Overlays or Ruta_Cursor is not None:
        Filtro, Etiqueta_Final = Construir_Filtro_Overlays(
            Carteles,
            Indice_Cursor if Ruta_Cursor is not None else None,
        )
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
            str(Ruta_Salida),
        ]
    )

    return Comando


def Construir_Filtro_Overlays(
    Carteles: list[dict[str, object]],
    Indice_Cursor: int | None = None,
) -> tuple[str, str]:

    """
    Construye el filtergraph de overlays para FFmpeg.
    Cada imagen se activa solo dentro del rango de tiempo del
    cartel correspondiente.

    Parametros:
    - Carteles: Carteles normalizados y ordenados.
    - Indice_Cursor: Indice de entrada FFmpeg para cursor.

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

    if Indice_Cursor is not None:
        Salida = "[v_cursor]"
        Partes.append(
            f"{Entrada_Actual}[{Indice_Cursor}:v]"
            f"overlay=0:0:shortest=1{Salida}"
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

    Ruta_Crudo = Capturar_Video(Tutorial)
    Escribir_Mensaje(f"Video crudo generado: {Ruta_Crudo}")

    Ruta_Texto = Generar_Tutorial_Texto(Tutorial)
    Escribir_Mensaje(f"Texto generado: {Ruta_Texto}")

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
