"use strict";

const Config_Semaplan = {
  Url: "https://cprdnxkkhuuhdispubds.supabase.co",
  Anon_Key:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcmRueGtraHV1aGRpc3" +
    "B1YmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzgxMTQsImV4" +
    "cCI6MjA5MTE1NDExNH0" +
    ".lKLesAkMG4zUzaD6urbNDnmcC3vOL7VNeTGDwoTaDTI",
};

const Criterios_Default = [
  { Nombre: "Caratula", Peso: 1, Valor: "" },
  { Nombre: "Disfrute", Peso: 1, Valor: "" },
  { Nombre: "Coherencia", Peso: 1, Valor: "" },
  { Nombre: "Originalidad", Peso: 1, Valor: "" },
];

const Spotify_Scopes = [
  "playlist-modify-private",
  "playlist-read-private",
  "user-read-private",
];

const Storage_Keys = {
  Spotify_Client_Id: "Melomania_Spotify_Client_Id",
  Spotify_Tokens: "Melomania_Spotify_Tokens",
  Spotify_Verifier: "Melomania_Spotify_Verifier",
  Spotify_State: "Melomania_Spotify_State",
  Lastfm_Config: "Melomania_Lastfm_Config",
  Umbral_Escuchas: "Melomania_Umbral_Escuchas",
};

const Estado = {
  Sesion: null,
  Estado_Semaplan: null,
  Version: null,
  Actualizado_En: null,
  Biblioteca: [],
  Objetivo_Melomania: null,
  Spotify: {
    Client_Id: "",
    Tokens: null,
    Perfil: null,
    Resultados: [],
    Album_Seleccionado: null,
  },
  Lastfm: {
    Api_Key: "",
    Usuario: "",
    Conectado: false,
  },
  Modal: null,
};

const $ = (Selector) => document.querySelector(Selector);

const El = {
  Form_Conexion: $("#Form_Conexion"),
  Email: $("#Email"),
  Password: $("#Password"),
  Mensaje_Conexion: $("#Mensaje_Conexion"),
  Estado_Semaplan: $("#Estado_Semaplan"),
  Estado_Spotify: $("#Estado_Spotify"),
  Estado_Lastfm: $("#Estado_Lastfm"),
  Spotify_Client_Id: $("#Spotify_Client_Id"),
  Spotify_Redirect_Uri: $("#Spotify_Redirect_Uri"),
  Copiar_Redirect: $("#Copiar_Redirect"),
  Conectar_Spotify: $("#Conectar_Spotify"),
  Lastfm_Usuario: $("#Lastfm_Usuario"),
  Lastfm_Api_Key: $("#Lastfm_Api_Key"),
  Conectar_Lastfm: $("#Conectar_Lastfm"),
  Umbral_Escuchas: $("#Umbral_Escuchas"),
  Actualizar_Escuchas: $("#Actualizar_Escuchas"),
  Nota_Integraciones: $("#Nota_Integraciones"),
  Form_Busqueda_Spotify: $("#Form_Busqueda_Spotify"),
  Busqueda: $("#Busqueda"),
  Buscar_Spotify: $("#Buscar_Spotify"),
  Anio_Album: $("#Anio_Album"),
  Emoji_Album: $("#Emoji_Album"),
  Guardar_Biblioteca: $("#Guardar_Biblioteca"),
  Resultados_Spotify: $("#Resultados_Spotify"),
  Nota_Spotify: $("#Nota_Spotify"),
  Actualizar: $("#Actualizar"),
  Accion_Melomania: $("#Accion_Melomania"),
  Crear_Melomania: $("#Crear_Melomania"),
  Lista_Albumes: $("#Lista_Albumes"),
  Resumen_Biblioteca: $("#Resumen_Biblioteca"),
  Modal: $("#Modal_Puntuacion"),
  Modal_Titulo: $("#Modal_Titulo"),
  Modal_Artista: $("#Modal_Artista"),
  Lista_Canciones: $("#Lista_Canciones"),
  Lista_Criterios: $("#Lista_Criterios"),
  Resultado_Puntuacion: $("#Resultado_Puntuacion"),
  Detalle_Puntuacion: $("#Detalle_Puntuacion"),
  Agregar_Criterio: $("#Agregar_Criterio"),
  Calcular_Puntuacion: $("#Calcular_Puntuacion"),
  Fijar_Puntuacion: $("#Fijar_Puntuacion"),
  Borrar_Puntuacion: $("#Borrar_Puntuacion"),
};

function Set_Mensaje(Texto, Tipo = "") {
  El.Mensaje_Conexion.textContent = Texto;
  El.Mensaje_Conexion.className = `Mensaje ${Tipo}`.trim();
}

function Set_Estado_Semaplan(Texto, Tipo = "") {
  El.Estado_Semaplan.textContent = Texto;
  El.Estado_Semaplan.className = `Chip ${Tipo}`.trim();
}

function Set_Estado_Spotify(Texto, Tipo = "") {
  El.Estado_Spotify.textContent = Texto;
  El.Estado_Spotify.className = `Chip ${Tipo}`.trim();
}

function Set_Estado_Lastfm(Texto, Tipo = "") {
  El.Estado_Lastfm.textContent = Texto;
  El.Estado_Lastfm.className = `Chip ${Tipo}`.trim();
}

function Redirect_Uri_Spotify() {
  return `${window.location.origin}${window.location.pathname}`;
}

function Leer_Local_Json(Clave, Fallback = null) {
  try {
    const Raw = localStorage.getItem(Clave);
    return Raw ? JSON.parse(Raw) : Fallback;
  } catch {
    return Fallback;
  }
}

function Guardar_Local_Json(Clave, Valor) {
  localStorage.setItem(Clave, JSON.stringify(Valor));
}

function Cargar_Config_Local() {
  Estado.Spotify.Client_Id =
    localStorage.getItem(Storage_Keys.Spotify_Client_Id) || "";
  Estado.Spotify.Tokens =
    Leer_Local_Json(Storage_Keys.Spotify_Tokens, null);

  const Lastfm = Leer_Local_Json(Storage_Keys.Lastfm_Config, {});
  Estado.Lastfm.Api_Key = Lastfm.Api_Key || "";
  Estado.Lastfm.Usuario = Lastfm.Usuario || "";
  Estado.Lastfm.Conectado = Lastfm.Conectado === true;

  El.Spotify_Client_Id.value = Estado.Spotify.Client_Id;
  El.Spotify_Redirect_Uri.value = Redirect_Uri_Spotify();
  El.Lastfm_Api_Key.value = Estado.Lastfm.Api_Key;
  El.Lastfm_Usuario.value = Estado.Lastfm.Usuario;
  El.Umbral_Escuchas.value =
    localStorage.getItem(Storage_Keys.Umbral_Escuchas) || "1";
}

function Guardar_Config_Lastfm() {
  Estado.Lastfm.Api_Key = El.Lastfm_Api_Key.value.trim();
  Estado.Lastfm.Usuario = El.Lastfm_Usuario.value.trim();
  Estado.Lastfm.Conectado = false;
  Guardar_Local_Json(Storage_Keys.Lastfm_Config, Estado.Lastfm);
}

function Spotify_Token_Vigente() {
  const Tokens = Estado.Spotify.Tokens;
  if (!Tokens?.access_token) return false;
  return Number(Tokens.expires_at || 0) > Date.now() + 60000;
}

function Render_Estado_Integraciones() {
  if (Estado.Spotify.Perfil) {
    Set_Estado_Spotify("Spotify conectado", "Chip_Activo");
  } else if (Estado.Spotify.Tokens?.access_token) {
    Set_Estado_Spotify("Spotify con token", "Chip_Pendiente");
  } else {
    Set_Estado_Spotify("Spotify pendiente", "Chip_Pendiente");
  }

  if (Estado.Lastfm.Conectado) {
    Set_Estado_Lastfm("last.fm conectado", "Chip_Activo");
  } else if (Estado.Lastfm.Api_Key && Estado.Lastfm.Usuario) {
    Set_Estado_Lastfm("last.fm configurado", "Chip_Pendiente");
  } else {
    Set_Estado_Lastfm("last.fm pendiente", "Chip_Pendiente");
  }

  const Spotify_Listo = Boolean(Estado.Spotify.Tokens?.access_token);
  const Lastfm_Listo = Boolean(
    Estado.Lastfm.Api_Key && Estado.Lastfm.Usuario
  );
  El.Busqueda.disabled = !Spotify_Listo;
  El.Buscar_Spotify.disabled = !Spotify_Listo;
  El.Anio_Album.disabled = !Spotify_Listo;
  El.Emoji_Album.disabled = !Spotify_Listo;
  El.Guardar_Biblioteca.disabled =
    !Spotify_Listo || !Estado.Spotify.Album_Seleccionado;
  El.Actualizar_Escuchas.disabled =
    !Lastfm_Listo || !Estado.Sesion || !Estado.Biblioteca.length;
}

function Cabeceras_Supabase(Token = "") {
  const Cabeceras = {
    apikey: Config_Semaplan.Anon_Key,
    "Content-Type": "application/json",
  };
  if (Token) {
    Cabeceras.Authorization = `Bearer ${Token}`;
  }
  return Cabeceras;
}

async function Leer_Error_Respuesta(Respuesta) {
  const Texto = await Respuesta.text().catch(() => "");
  if (!Texto) return `Error HTTP ${Respuesta.status}`;
  try {
    const Json = JSON.parse(Texto);
    return Json.error_description || Json.message ||
      Json.msg || Texto;
  } catch {
    return Texto;
  }
}

async function Fetch_Json(Url, Opciones = {}) {
  const Respuesta = await fetch(Url, Opciones);
  if (!Respuesta.ok) {
    throw new Error(await Leer_Error_Respuesta(Respuesta));
  }
  if (Respuesta.status === 204) return null;
  return Respuesta.json();
}

function Random_String(Longitud = 64) {
  const Posibles =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const Valores = crypto.getRandomValues(new Uint8Array(Longitud));
  return Array.from(Valores)
    .map((Valor) => Posibles[Valor % Posibles.length])
    .join("");
}

async function Sha256(Texto) {
  const Datos = new TextEncoder().encode(Texto);
  return crypto.subtle.digest("SHA-256", Datos);
}

function Base64_Url(Buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(Buffer)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function Code_Challenge(Verifier) {
  return Base64_Url(await Sha256(Verifier));
}

function Params_Query(Objeto) {
  const Params = new URLSearchParams();
  Object.entries(Objeto).forEach(([Clave, Valor]) => {
    if (Valor === undefined || Valor === null || Valor === "") return;
    Params.set(Clave, String(Valor));
  });
  return Params;
}

function Normalizar_Texto(Valor) {
  return String(Valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function Formatear_Fecha(Valor) {
  if (!Valor) return "";
  const Fecha = new Date(Valor);
  if (Number.isNaN(Fecha.getTime())) return "";
  return Fecha.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function Numero_Valido(Valor, Min = 1, Max = 10) {
  const Numero = Number(Valor);
  if (!Number.isFinite(Numero)) return null;
  if (Numero < Min || Numero > Max) return null;
  return Numero;
}

function Clonar(Json) {
  return JSON.parse(JSON.stringify(Json));
}

function Crear_Id(Prefijo) {
  return `${Prefijo}_${Date.now()}_` +
    `${Math.floor(Math.random() * 100000)}`;
}

function Fecha_ISO(Fecha) {
  return `${Fecha.getFullYear()}-${String(
    Fecha.getMonth() + 1
  ).padStart(2, "0")}-${String(Fecha.getDate()).padStart(2, "0")}`;
}

function Id_Periodo(Tipo, Inicio, Fin) {
  return `P_${Tipo}_${Inicio}_${Fin}`;
}

function Asegurar_Modelo_Base(Estado_Base) {
  if (!Estado_Base.Planes_Periodo ||
      typeof Estado_Base.Planes_Periodo !== "object") {
    Estado_Base.Planes_Periodo = {};
  }

  const Modelo = Estado_Base.Planes_Periodo;
  Modelo.Version = 2;
  Modelo.Periodos = Modelo.Periodos &&
    typeof Modelo.Periodos === "object" ? Modelo.Periodos : {};
  Modelo.Objetivos = Modelo.Objetivos &&
    typeof Modelo.Objetivos === "object" ? Modelo.Objetivos : {};
  Modelo.Subobjetivos = Modelo.Subobjetivos &&
    typeof Modelo.Subobjetivos === "object" ? Modelo.Subobjetivos : {};
  Modelo.Partes = Modelo.Partes &&
    typeof Modelo.Partes === "object" ? Modelo.Partes : {};
  Modelo.Avances = Modelo.Avances &&
    typeof Modelo.Avances === "object" ? Modelo.Avances : {};
  Modelo.UI = Modelo.UI && typeof Modelo.UI === "object"
    ? Modelo.UI
    : {};
  return Modelo;
}

function Asegurar_Periodo_Anio(Modelo) {
  const Anio = new Date().getFullYear();
  const Inicio = `${Anio}-01-01`;
  const Fin = `${Anio}-12-31`;
  const Id = Id_Periodo("Anio", Inicio, Fin);
  const Ahora = new Date().toISOString();

  Modelo.Periodos[Id] = {
    ...(Modelo.Periodos[Id] || {}),
    Id,
    Tipo: "Anio",
    Inicio,
    Fin,
    Titulo: String(Anio),
    Resumen: Modelo.Periodos[Id]?.Resumen || "",
    Parent_Id: null,
    Tags: Array.isArray(Modelo.Periodos[Id]?.Tags)
      ? Modelo.Periodos[Id].Tags
      : [],
    Estado: Modelo.Periodos[Id]?.Estado || "Activo",
    Orden: Number.isFinite(Number(Modelo.Periodos[Id]?.Orden))
      ? Number(Modelo.Periodos[Id].Orden)
      : 0,
    Creado_En: Modelo.Periodos[Id]?.Creado_En || Ahora,
    Actualizado_En: Ahora,
  };

  Modelo.UI.Filtro_Tipo = Modelo.UI.Filtro_Tipo || "Anio";
  Modelo.UI.Anio_Desde = Number(Modelo.UI.Anio_Desde) || Anio;
  Modelo.UI.Anio_Hasta = Number(Modelo.UI.Anio_Hasta) || Anio;
  Modelo.UI.Anio_Activo = Anio;
  Modelo.UI.Periodo_Activo_Id = Id;
  Modelo.UI.Capas_Visibles = Array.isArray(Modelo.UI.Capas_Visibles)
    ? Modelo.UI.Capas_Visibles
    : ["Anio", "Semestre", "Trimestre", "Mes"];

  return Modelo.Periodos[Id];
}

function Crear_Objetivo_Melomania_En_Estado(Estado_Base) {
  const Nuevo_Estado = Clonar(Estado_Base);
  const Modelo = Asegurar_Modelo_Base(Nuevo_Estado);
  const Existente = Buscar_Objetivo_Melomania(Modelo);
  if (Existente) return Nuevo_Estado;

  const Periodo = Asegurar_Periodo_Anio(Modelo);
  const Ahora = new Date().toISOString();
  const Id = Crear_Id("Plan_Obj");
  const Orden = Object.values(Modelo.Objetivos || {})
    .filter((Objetivo) => {
      return Objetivo &&
        typeof Objetivo === "object" &&
        Objetivo.Periodo_Id === Periodo.Id &&
        !Objetivo.Eliminado_Local;
    }).length;

  Modelo.Objetivos[Id] = {
    Id,
    Periodo_Id: Periodo.Id,
    Objetivo_Padre_Id: null,
    Periodo_Origen: "",
    Regla_Distribucion: "",
    Estado_Vinculo: "Directo",
    Nombre: "Melomanía",
    Descripcion:
      "Biblioteca de álbumes escuchados y puntuados.",
    Emoji: "🎧",
    Color: "#267a55",
    Target_Total: 0,
    Target_Automatico: 0,
    Target_Actual: 0,
    Target_Fijado: 0,
    Unidad: "Minutos",
    Unidad_Custom: "",
    Unidad_Subobjetivos_Default: "Minutos",
    Unidad_Subobjetivos_Custom_Default: "",
    Tiempo_Valor: 1,
    Tiempo_Modo: "Minutos_Por_Unidad",
    Regla_Lectura: "Minutos",
    Modo_Avance: "Sin_Metrica",
    Modo_Progreso: "Hibrido",
    Target_Suma_Componentes: true,
    Progreso_Manual: 0,
    Progreso_Importado: 0,
    Progreso_Leido: 0,
    Progreso_Subobjetivos: 0,
    Progreso_Total: 0,
    Target_Pendiente: 0,
    Fecha_Inicio: Fecha_ISO(new Date()),
    Fecha_Objetivo: "",
    Fecha_Fin: "",
    Hora_Fin: "",
    Ajustes_Periodos: {},
    Redistribucion_Target: {
      Tipo: "",
      Modo: "Equitativa",
      Valores: {},
      Fijados: {},
      Anulados: {},
    },
    Oculto_Periodos: {},
    Fijado: false,
    Target_Fijado_Por_Usuario: false,
    Auto_Redistribucion: true,
    Pausado: false,
    Eliminado_Local: false,
    Vinculo_Sidebar_Activo: true,
    Vinculo_Tipo: "Ninguno",
    Vinculo_Id: "",
    Vinculo_Objetivo_Id: "",
    Vinculo_Subobjetivo_Id: "",
    Vinculo_Texto: "",
    Etiquetas_Ids: [],
    Tags: [],
    Metadatos_Campos: [
      { Id: "Artista", Nombre: "Artista", Tipo: "String" },
      { Id: "Año", Nombre: "Año", Tipo: "String" },
      { Id: "Género", Nombre: "Género", Tipo: "String" },
      { Id: "Puntuación", Nombre: "Puntuación", Tipo: "Numerico" },
      { Id: "Spotify", Nombre: "Spotify", Tipo: "String" },
      { Id: "Playlist", Nombre: "Playlist", Tipo: "String" },
    ],
    Metadatos_Campos_Config: true,
    Estado: "Activo",
    Warnings: [],
    Habitos_Vinculos: [],
    Habitos_Vinculos_Hijos_Default: [],
    Orden,
    Creado_En: Ahora,
    Actualizado_En: Ahora,
  };

  Nuevo_Estado.Sync_Datos_Marca_Ms = Date.now();
  return Nuevo_Estado;
}

function Es_Sigla(Palabra) {
  return /^[A-Z0-9]{2,5}$/.test(Palabra);
}

function Capitalizar_Oracion(Texto) {
  const Limpio = String(Texto || "").trim();
  if (!Limpio) return "";
  const Palabras = Limpio.split(/\s+/);
  return Palabras.map((Palabra, Indice) => {
    if (Es_Sigla(Palabra)) return Palabra;
    const Baja = Palabra.toLocaleLowerCase("es-AR");
    if (Indice === 0) {
      return Baja.charAt(0).toLocaleUpperCase("es-AR") + Baja.slice(1);
    }
    return Baja;
  }).join(" ");
}

function Nombre_Playlist(Album) {
  const Artista = Album.artists?.[0]?.name || "Artista";
  const Anio = Anio_Album_Spotify(Album);
  return `${Artista}. ${Capitalizar_Oracion(Album.name)} (${Anio})`;
}

function Anio_Album_Spotify(Album) {
  return String(Album.release_date || "").slice(0, 4) ||
    String(new Date().getFullYear());
}

function Imagen_Album(Album) {
  const Imagenes = Array.isArray(Album.images) ? Album.images : [];
  return Imagenes[Imagenes.length - 1]?.url ||
    Imagenes[0]?.url ||
    "";
}

function Duracion_Minutos(Track) {
  return Math.round((Number(Track.duration_ms) || 0) / 600) / 100;
}

async function Iniciar_OAuth_Spotify() {
  const Client_Id = El.Spotify_Client_Id.value.trim();
  if (!Client_Id) {
    throw new Error("Pegá el Spotify Client ID.");
  }

  Estado.Spotify.Client_Id = Client_Id;
  localStorage.setItem(Storage_Keys.Spotify_Client_Id, Client_Id);

  const Verifier = Random_String(64);
  const State = Random_String(32);
  localStorage.setItem(Storage_Keys.Spotify_Verifier, Verifier);
  localStorage.setItem(Storage_Keys.Spotify_State, State);

  const Params = Params_Query({
    client_id: Client_Id,
    response_type: "code",
    redirect_uri: Redirect_Uri_Spotify(),
    scope: Spotify_Scopes.join(" "),
    state: State,
    code_challenge_method: "S256",
    code_challenge: await Code_Challenge(Verifier),
  });

  window.location.href =
    `https://accounts.spotify.com/authorize?${Params.toString()}`;
}

async function Canjear_Codigo_Spotify(Code) {
  const Client_Id = localStorage.getItem(Storage_Keys.Spotify_Client_Id);
  const Verifier = localStorage.getItem(Storage_Keys.Spotify_Verifier);
  if (!Client_Id || !Verifier) {
    throw new Error("Falta el verificador local de Spotify.");
  }

  const Datos = await Fetch_Json(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: Params_Query({
        client_id: Client_Id,
        grant_type: "authorization_code",
        code: Code,
        redirect_uri: Redirect_Uri_Spotify(),
        code_verifier: Verifier,
      }).toString(),
    }
  );

  Estado.Spotify.Client_Id = Client_Id;
  Estado.Spotify.Tokens = {
    ...Datos,
    expires_at: Date.now() + (Number(Datos.expires_in) || 3600) * 1000,
  };
  Guardar_Local_Json(Storage_Keys.Spotify_Tokens, Estado.Spotify.Tokens);
  localStorage.removeItem(Storage_Keys.Spotify_Verifier);
  localStorage.removeItem(Storage_Keys.Spotify_State);
  await Cargar_Perfil_Spotify();
}

async function Refrescar_Spotify() {
  const Tokens = Estado.Spotify.Tokens;
  const Client_Id = Estado.Spotify.Client_Id ||
    localStorage.getItem(Storage_Keys.Spotify_Client_Id);
  if (!Tokens?.refresh_token || !Client_Id) {
    throw new Error("Spotify requiere reconexión.");
  }

  const Datos = await Fetch_Json(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: Params_Query({
        grant_type: "refresh_token",
        refresh_token: Tokens.refresh_token,
        client_id: Client_Id,
      }).toString(),
    }
  );

  Estado.Spotify.Tokens = {
    ...Tokens,
    ...Datos,
    refresh_token: Datos.refresh_token || Tokens.refresh_token,
    expires_at: Date.now() + (Number(Datos.expires_in) || 3600) * 1000,
  };
  Guardar_Local_Json(Storage_Keys.Spotify_Tokens, Estado.Spotify.Tokens);
}

async function Spotify_Fetch(Path, Opciones = {}) {
  if (!Spotify_Token_Vigente()) {
    await Refrescar_Spotify();
  }
  const Url = Path.startsWith("https://")
    ? Path
    : `https://api.spotify.com/v1${Path}`;
  const Cabeceras = {
    ...(Opciones.headers || {}),
    Authorization: `Bearer ${Estado.Spotify.Tokens.access_token}`,
  };
  if (Opciones.body) {
    Cabeceras["Content-Type"] = "application/json";
  }
  return Fetch_Json(Url, {
    ...Opciones,
    headers: Cabeceras,
  });
}

async function Cargar_Perfil_Spotify() {
  if (!Estado.Spotify.Tokens?.access_token) return;
  try {
    Estado.Spotify.Perfil = await Spotify_Fetch("/me");
    Set_Estado_Spotify("Spotify conectado", "Chip_Activo");
  } catch (Error) {
    Estado.Spotify.Perfil = null;
    Set_Estado_Spotify("Spotify con error", "Chip_Error");
    throw Error;
  } finally {
    Render_Estado_Integraciones();
  }
}

async function Procesar_Retorno_Spotify() {
  const Url = new URL(window.location.href);
  const Code = Url.searchParams.get("code");
  const Error_Spotify = Url.searchParams.get("error");
  const State = Url.searchParams.get("state");
  if (!Code && !Error_Spotify) return;

  window.history.replaceState({}, "", Redirect_Uri_Spotify());

  if (Error_Spotify) {
    throw new Error(`Spotify rechazó la conexión: ${Error_Spotify}`);
  }

  const State_Local = localStorage.getItem(Storage_Keys.Spotify_State);
  if (!State_Local || State_Local !== State) {
    throw new Error("La respuesta de Spotify no coincide con la sesión.");
  }

  await Canjear_Codigo_Spotify(Code);
  Set_Mensaje("Spotify conectado.", "Ok");
}

async function Buscar_Albumes_Spotify(Query) {
  const Datos = await Spotify_Fetch(
    `/search?${Params_Query({
      q: Query,
      type: "album",
      limit: 8,
    }).toString()}`
  );
  Estado.Spotify.Resultados = Datos.albums?.items || [];
  Render_Resultados_Spotify();
}

async function Seleccionar_Album_Spotify(Album_Parcial) {
  const Album = await Spotify_Fetch(`/albums/${Album_Parcial.id}`);
  Estado.Spotify.Album_Seleccionado = Album;
  El.Anio_Album.value = Anio_Album_Spotify(Album);
  El.Emoji_Album.value = El.Emoji_Album.value || "🎧";
  El.Nota_Spotify.textContent =
    `${Album.artists?.[0]?.name || "Artista"} / ` +
    `${Album.name} / ${Album.tracks?.items?.length || 0} canciones.`;
  Render_Resultados_Spotify();
  Render_Estado_Integraciones();
}

function Render_Resultados_Spotify() {
  El.Resultados_Spotify.innerHTML = "";
  Estado.Spotify.Resultados.forEach((Album) => {
    const Boton = document.createElement("button");
    Boton.className = "Resultado_Spotify";
    if (Estado.Spotify.Album_Seleccionado?.id === Album.id) {
      Boton.classList.add("Activo");
    }
    Boton.type = "button";
    Boton.addEventListener("click", () => {
      Seleccionar_Album_Spotify(Album).catch((Error) => {
        Set_Mensaje(Error.message || String(Error), "Error");
      });
    });

    const Imagen = document.createElement("img");
    Imagen.alt = "";
    Imagen.src = Imagen_Album(Album);

    const Info = document.createElement("div");
    Info.className = "Resultado_Spotify_Info";
    const Titulo = document.createElement("strong");
    Titulo.textContent = Album.name;
    const Meta = document.createElement("span");
    Meta.textContent = [
      Album.artists?.map((Artista) => Artista.name).join(", "),
      Anio_Album_Spotify(Album),
      `${Album.total_tracks || 0} canciones`,
    ].filter(Boolean).join(" / ");
    Info.append(Titulo, Meta);
    Boton.append(Imagen, Info);
    El.Resultados_Spotify.appendChild(Boton);
  });
}

async function Crear_Playlist_Spotify(Album) {
  const Perfil = Estado.Spotify.Perfil || await Spotify_Fetch("/me");
  Estado.Spotify.Perfil = Perfil;
  const Nombre = Nombre_Playlist({
    ...Album,
    release_date: El.Anio_Album.value || Album.release_date,
  });
  const Playlist = await Spotify_Fetch(
    `/users/${encodeURIComponent(Perfil.id)}/playlists`,
    {
      method: "POST",
      body: JSON.stringify({
        name: Nombre,
        public: false,
        description: "Playlist privada creada desde Semaplan Melomanía.",
      }),
    }
  );
  const Uris = (Album.tracks?.items || [])
    .map((Track) => Track.uri)
    .filter(Boolean);
  for (let I = 0; I < Uris.length; I += 100) {
    await Spotify_Fetch(`/playlists/${Playlist.id}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris: Uris.slice(I, I + 100) }),
    });
  }
  return Playlist;
}

function Crear_Album_En_Estado(Estado_Base, Album, Playlist) {
  const Nuevo_Estado = Clonar(Estado_Base);
  const Modelo = Asegurar_Modelo_Base(Nuevo_Estado);
  const Objetivo = Buscar_Objetivo_Melomania(Modelo);
  if (!Objetivo) {
    throw new Error("Primero creá Melomanía en Semaplan.");
  }
  const Duplicado = Object.values(Modelo.Subobjetivos || {})
    .some((Sub) => {
      return Sub &&
        typeof Sub === "object" &&
        Leer_Metadato(Sub.Metadatos, ["Spotify"]) === Album.id &&
        !Sub.Eliminado_Local;
    });
  if (Duplicado) {
    throw new Error("Ese álbum ya está guardado en Melomanía.");
  }

  const Ahora = new Date().toISOString();
  const Sub_Id = Crear_Id("Plan_Sub");
  const Emoji = El.Emoji_Album.value.trim() || "🎧";
  const Tracks = Album.tracks?.items || [];
  const Total_Minutos = Tracks.reduce(
    (Total, Track) => Total + Duracion_Minutos(Track),
    0
  );
  const Orden = Object.values(Modelo.Subobjetivos || {})
    .filter((Sub) => {
      return Sub &&
        typeof Sub === "object" &&
        Sub.Objetivo_Id === Objetivo.Id &&
        !Sub.Eliminado_Local;
    }).length;

  Modelo.Subobjetivos[Sub_Id] = {
    Id: Sub_Id,
    Objetivo_Id: Objetivo.Id,
    Parent_Subobjetivo_Id: null,
    Subobjetivo_Padre_Id: "",
    Emoji,
    Texto: Capitalizar_Oracion(Album.name),
    Target_Total: Math.round(Total_Minutos * 100) / 100,
    Target_Suma_Componentes: true,
    Aporte_Meta: 1,
    Unidad: "Minutos",
    Unidad_Custom: "",
    Tiempo_Valor: 1,
    Tiempo_Modo: "Minutos_Por_Unidad",
    Progreso_Manual: 0,
    Progreso_Avances: 0,
    Fecha_Objetivo: "",
    Fecha_Inicio: Fecha_ISO(new Date()),
    Fecha_Fin: "",
    Hora_Fin: "",
    Metadatos: {
      Artista: Album.artists?.[0]?.name || "",
      "Año": El.Anio_Album.value.trim() || Anio_Album_Spotify(Album),
      "Género": (Album.genres || []).join(", "),
      Spotify: Album.id,
      Playlist: Playlist.id,
    },
    Estado: "Activo",
    Hecha: false,
    Importado: true,
    Habitos_Vinculos: [],
    Habitos_Vinculos_Hijos_Default: [],
    Eliminado_Local: false,
    Orden,
  };

  Tracks.forEach((Track, Indice) => {
    const Parte_Id = Crear_Id("Plan_Parte");
    Modelo.Partes[Parte_Id] = {
      Id: Parte_Id,
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Id,
      Emoji,
      Nombre: Capitalizar_Oracion(Track.name),
      Aporte_Total: Duracion_Minutos(Track),
      Unidad: "Minutos",
      Unidad_Custom: "",
      Tiempo_Valor: 1,
      Tiempo_Modo: "Minutos_Por_Unidad",
      Progreso_Avances: 0,
      Progreso_Total: 0,
      Fecha_Inicio: "",
      Fecha_Objetivo: "",
      Fecha_Fin: "",
      Hora_Fin: "",
      Estado: "Pendiente",
      Habitos_Vinculos: [],
      Orden: Indice,
      Eliminado_Local: false,
      Creado_En: Ahora,
      Actualizado_En: Ahora,
    };
  });

  Nuevo_Estado.Sync_Datos_Marca_Ms = Date.now();
  return Nuevo_Estado;
}

async function Guardar_Album_Seleccionado() {
  const Album = Estado.Spotify.Album_Seleccionado;
  if (!Album) throw new Error("Seleccioná un álbum de Spotify.");
  if (!Estado.Sesion) throw new Error("Primero conectá Semaplan.");

  El.Guardar_Biblioteca.disabled = true;
  Set_Mensaje("Creando playlist privada y guardando álbum...", "");
  try {
    const Playlist = await Crear_Playlist_Spotify(Album);
    const Fila_Fresca = await Leer_Fila_Semaplan();
    const Nuevo_Estado = Crear_Album_En_Estado(
      Fila_Fresca.estado || {},
      Album,
      Playlist
    );
    await Guardar_Estado_Remoto(
      Nuevo_Estado,
      Number(Fila_Fresca.version) || 1
    );
    await Cargar_Estado_Semaplan();
    Set_Mensaje("Álbum guardado y playlist creada.", "Ok");
  } finally {
    Render_Estado_Integraciones();
  }
}

async function Lastfm_Fetch(Parametros) {
  const Params = Params_Query({
    ...Parametros,
    api_key: Estado.Lastfm.Api_Key,
    format: "json",
  });
  return Fetch_Json(`https://ws.audioscrobbler.com/2.0/?${Params}`);
}

async function Conectar_Lastfm() {
  Guardar_Config_Lastfm();
  if (!Estado.Lastfm.Api_Key || !Estado.Lastfm.Usuario) {
    throw new Error("Completá usuario y API key de last.fm.");
  }
  const Datos = await Lastfm_Fetch({
    method: "user.getrecenttracks",
    user: Estado.Lastfm.Usuario,
    limit: 1,
  });
  if (Datos.error) {
    throw new Error(Datos.message || "last.fm rechazó la conexión.");
  }
  Estado.Lastfm.Conectado = true;
  Guardar_Local_Json(Storage_Keys.Lastfm_Config, Estado.Lastfm);
  Set_Estado_Lastfm("last.fm conectado", "Chip_Activo");
  Render_Estado_Integraciones();
  Set_Mensaje("last.fm conectado.", "Ok");
}

async function Conteo_Tema_Lastfm(Artista, Tema) {
  const Datos = await Lastfm_Fetch({
    method: "track.getInfo",
    artist: Artista,
    track: Tema,
    username: Estado.Lastfm.Usuario,
    autocorrect: 1,
  });
  const Conteo = Number(Datos.track?.userplaycount);
  return Number.isFinite(Conteo) ? Conteo : 0;
}

function Aplicar_Escuchas_En_Estado(Estado_Base, Resultados, Umbral) {
  const Nuevo_Estado = Clonar(Estado_Base);
  const Modelo = Asegurar_Modelo_Base(Nuevo_Estado);
  let Cambios = 0;

  Resultados.forEach((Resultado) => {
    const Sub = Modelo.Subobjetivos?.[Resultado.Album_Id];
    if (!Sub) return;
    let Todas = true;
    Resultado.Canciones.forEach((Cancion) => {
      const Parte = Modelo.Partes?.[Cancion.Parte_Id];
      if (!Parte) return;
      const Realizada = Cancion.Conteo >= Umbral;
      Todas = Todas && Realizada;
      const Estado_Nuevo = Realizada ? "Realizada" : "Pendiente";
      if (Parte.Estado !== Estado_Nuevo) {
        Parte.Estado = Estado_Nuevo;
        Parte.Actualizado_En = new Date().toISOString();
        Cambios += 1;
      }
    });
    const Sub_Estado = Todas ? "Cumplido" : "Activo";
    if (Sub.Estado !== Sub_Estado || Sub.Hecha !== Todas) {
      Sub.Estado = Sub_Estado;
      Sub.Hecha = Todas;
      Cambios += 1;
    }
  });

  if (Cambios > 0) {
    Nuevo_Estado.Sync_Datos_Marca_Ms = Date.now();
  }
  return { Estado: Nuevo_Estado, Cambios };
}

async function Actualizar_Escuchas_Lastfm() {
  if (!Estado.Sesion) throw new Error("Primero conectá Semaplan.");
  Guardar_Config_Lastfm();
  const Umbral = Math.max(1, Math.floor(Number(El.Umbral_Escuchas.value)));
  localStorage.setItem(Storage_Keys.Umbral_Escuchas, String(Umbral));
  if (!Estado.Lastfm.Api_Key || !Estado.Lastfm.Usuario) {
    throw new Error("Conectá last.fm antes de actualizar escuchas.");
  }

  El.Actualizar_Escuchas.disabled = true;
  Set_Mensaje("Leyendo conteos de last.fm...", "");
  try {
    const Resultados = [];
    for (const Album of Estado.Biblioteca) {
      const Canciones = [];
      for (const Cancion of Album.Canciones) {
        const Conteo = await Conteo_Tema_Lastfm(
          Album.Artista,
          Cancion.Nombre
        );
        Canciones.push({
          Parte_Id: Cancion.Id,
          Conteo,
        });
      }
      Resultados.push({
        Album_Id: Album.Id,
        Canciones,
      });
    }

    const Fila_Fresca = await Leer_Fila_Semaplan();
    const Aplicado = Aplicar_Escuchas_En_Estado(
      Fila_Fresca.estado || {},
      Resultados,
      Umbral
    );
    if (Aplicado.Cambios > 0) {
      await Guardar_Estado_Remoto(
        Aplicado.Estado,
        Number(Fila_Fresca.version) || 1
      );
    }
    await Cargar_Estado_Semaplan();
    Set_Mensaje(
      `Escuchas actualizadas. Cambios en Semaplan: ${Aplicado.Cambios}.`,
      "Ok"
    );
  } finally {
    Render_Estado_Integraciones();
  }
}

async function Autenticar_Semaplan(Email, Password) {
  const Url = `${Config_Semaplan.Url}/auth/v1/token` +
    "?grant_type=password";
  const Datos = await Fetch_Json(Url, {
    method: "POST",
    headers: Cabeceras_Supabase(),
    body: JSON.stringify({
      email: Email,
      password: Password,
    }),
  });

  if (!Datos.access_token || !Datos.user?.id) {
    throw new Error("Supabase no devolvió una sesión válida.");
  }

  return {
    Access_Token: Datos.access_token,
    User_Id: Datos.user.id,
    Email: Datos.user.email || Email,
  };
}

async function Leer_Fila_Semaplan() {
  if (!Estado.Sesion?.Access_Token) {
    throw new Error("Primero hay que conectar Semaplan.");
  }

  const Url = `${Config_Semaplan.Url}/rest/v1/estado_usuario` +
    "?select=estado,version,actualizado_en" +
    `&user_id=eq.${Estado.Sesion.User_Id}`;
  const Filas = await Fetch_Json(Url, {
    headers: Cabeceras_Supabase(Estado.Sesion.Access_Token),
  });

  const Fila = Array.isArray(Filas) ? Filas[0] : null;
  if (!Fila) {
    throw new Error("No se encontro estado_usuario para esta cuenta.");
  }
  return Fila;
}

async function Cargar_Estado_Semaplan() {
  const Fila = await Leer_Fila_Semaplan();
  Estado.Estado_Semaplan = Fila.estado || {};
  Estado.Version = Number(Fila.version) || 1;
  Estado.Actualizado_En = Fila.actualizado_en || "";
  Reconstruir_Biblioteca();
  Render_Biblioteca();
}

function Modelo_Planes() {
  const Modelo = Estado.Estado_Semaplan?.Planes_Periodo;
  if (!Modelo || typeof Modelo !== "object") return null;
  return Modelo;
}

function Buscar_Objetivo_Melomania(Modelo) {
  const Objetivos = Object.values(Modelo?.Objetivos || {});
  return Objetivos.find((Objetivo) => {
    if (!Objetivo || typeof Objetivo !== "object") return false;
    const Nombre = Normalizar_Texto(Objetivo.Nombre);
    return Nombre === "melomania" || Nombre.includes("melomania");
  }) || null;
}

function Leer_Metadato(Metadatos, Claves) {
  if (!Metadatos || typeof Metadatos !== "object") return "";
  for (const Clave of Claves) {
    if (Metadatos[Clave] !== undefined && Metadatos[Clave] !== null) {
      return String(Metadatos[Clave]);
    }
  }
  return "";
}

function Duracion_Parte_Segundos(Parte) {
  const Valor = Number(Parte.Aporte_Total ?? Parte.Target_Total ?? 0);
  if (!Number.isFinite(Valor) || Valor <= 0) return 0;

  const Unidad = Normalizar_Texto(
    `${Parte.Unidad || ""} ${Parte.Unidad_Custom || ""}`
  );
  if (Unidad.includes("hora")) return Valor * 3600;
  if (Unidad.includes("segundo")) return Valor;
  return Valor * 60;
}

function Formatear_Duracion(Segundos) {
  const Total = Math.max(0, Math.round(Number(Segundos) || 0));
  const Minutos = Math.floor(Total / 60);
  const Resto = String(Total % 60).padStart(2, "0");
  return `${Minutos}:${Resto}`;
}

function Parsear_Detalle_Puntuacion(Metadatos) {
  const Raw = Leer_Metadato(Metadatos, [
    "Puntuacion_Detalle",
    "Puntuacion_Detalle_JSON",
  ]);
  if (!Raw) return null;
  try {
    const Json = JSON.parse(Raw);
    return Json && typeof Json === "object" ? Json : null;
  } catch {
    return null;
  }
}

function Album_Desde_Subobjetivo(Subobjetivo, Modelo) {
  const Metadatos = Subobjetivo.Metadatos || {};
  const Partes = Object.values(Modelo.Partes || {})
    .filter((Parte) => {
      if (!Parte || typeof Parte !== "object") return false;
      return Parte.Subobjetivo_Id === Subobjetivo.Id &&
        !Parte.Eliminado_Local;
    })
    .sort((A, B) => (Number(A.Orden) || 0) - (Number(B.Orden) || 0));

  const Canciones = Partes.map((Parte) => ({
    Id: Parte.Id,
    Nombre: Parte.Nombre || Parte.Texto || "Canción sin nombre",
    Duracion_Segundos: Duracion_Parte_Segundos(Parte),
    Estado: Parte.Estado || "Pendiente",
  }));

  const Puntuacion = Leer_Metadato(Metadatos, [
    "Puntuacion",
    "Puntuación",
  ]);

  return {
    Id: Subobjetivo.Id,
    Nombre: Subobjetivo.Texto || "Álbum sin nombre",
    Artista: Leer_Metadato(Metadatos, ["Artista"]),
    Anio: Leer_Metadato(Metadatos, ["Año", "Anio", "Ano"]),
    Genero: Leer_Metadato(Metadatos, ["Genero", "Género"]),
    Puntuacion,
    Spotify: Leer_Metadato(Metadatos, ["Spotify"]),
    Playlist: Leer_Metadato(Metadatos, ["Playlist"]),
    Estado: Subobjetivo.Estado || "Activo",
    Canciones,
    Detalle_Puntuacion: Parsear_Detalle_Puntuacion(Metadatos),
  };
}

function Reconstruir_Biblioteca() {
  const Modelo = Modelo_Planes();
  Estado.Biblioteca = [];
  Estado.Objetivo_Melomania = null;

  if (!Modelo) return;
  const Objetivo = Buscar_Objetivo_Melomania(Modelo);
  Estado.Objetivo_Melomania = Objetivo;
  if (!Objetivo) return;

  Estado.Biblioteca = Object.values(Modelo.Subobjetivos || {})
    .filter((Subobjetivo) => {
      if (!Subobjetivo || typeof Subobjetivo !== "object") return false;
      return Subobjetivo.Objetivo_Id === Objetivo.Id &&
        !Subobjetivo.Eliminado_Local;
    })
    .sort((A, B) => (Number(A.Orden) || 0) - (Number(B.Orden) || 0))
    .map((Subobjetivo) => Album_Desde_Subobjetivo(Subobjetivo, Modelo));
}

function Render_Resumen() {
  const Albumes = Estado.Biblioteca.length;
  const Puntuados = Estado.Biblioteca
    .filter((Album) => Album.Puntuacion).length;
  const Canciones = Estado.Biblioteca
    .reduce((Total, Album) => Total + Album.Canciones.length, 0);

  El.Resumen_Biblioteca.innerHTML = "";
  [
    `${Albumes} álbumes`,
    `${Puntuados} puntuados`,
    `${Canciones} canciones`,
    Estado.Actualizado_En
      ? `Remoto ${Formatear_Fecha(Estado.Actualizado_En)}`
      : "Sin remoto",
  ].forEach((Texto) => {
    const Span = document.createElement("span");
    Span.textContent = Texto;
    El.Resumen_Biblioteca.appendChild(Span);
  });
}

function Render_Biblioteca() {
  El.Lista_Albumes.innerHTML = "";
  Render_Resumen();
  El.Accion_Melomania.hidden = true;

  if (!Estado.Objetivo_Melomania) {
    const Vacio = document.createElement("div");
    Vacio.className = "Vacio";
    Vacio.textContent =
      "No encontré un objetivo de Planes llamado Melomanía.";
    El.Lista_Albumes.appendChild(Vacio);
    El.Accion_Melomania.hidden = !Estado.Sesion;
    Render_Estado_Integraciones();
    return;
  }

  if (!Estado.Biblioteca.length) {
    const Vacio = document.createElement("div");
    Vacio.className = "Vacio";
    Vacio.textContent =
      "Melomanía existe, pero no tiene álbumes cargados.";
    El.Lista_Albumes.appendChild(Vacio);
    Render_Estado_Integraciones();
    return;
  }

  Estado.Biblioteca.forEach((Album) => {
    const Boton = document.createElement("button");
    Boton.className = "Album";
    Boton.type = "button";
    Boton.addEventListener("click", () => Abrir_Modal_Puntuacion(Album));

    const Nombre = document.createElement("span");
    Nombre.className = "Nombre";
    Nombre.textContent = Album.Nombre;

    const Artista = document.createElement("span");
    Artista.textContent = Album.Artista || "Sin artista";

    const Anio = document.createElement("span");
    Anio.textContent = Album.Anio || "-";

    const Puntuacion = document.createElement("span");
    Puntuacion.className = "Puntuacion";
    Puntuacion.textContent = Album.Puntuacion || "Nula";

    Boton.append(Nombre, Artista, Anio, Puntuacion);
    El.Lista_Albumes.appendChild(Boton);
  });
  Render_Estado_Integraciones();
}

function Detalle_Base(Album) {
  const Detalle = Album.Detalle_Puntuacion || {};
  return {
    Canciones: Detalle.Canciones || Detalle.canciones || {},
    Criterios: Array.isArray(Detalle.Criterios)
      ? Detalle.Criterios
      : Array.isArray(Detalle.criterios)
        ? Detalle.criterios
        : Clonar(Criterios_Default),
  };
}

function Abrir_Modal_Puntuacion(Album) {
  const Detalle = Detalle_Base(Album);
  Estado.Modal = {
    Album,
    Criterios: Detalle.Criterios.map((Criterio) => ({
      Nombre: Criterio.Nombre || Criterio.nombre || "",
      Peso: Criterio.Peso ?? Criterio.peso ?? 1,
      Valor: Criterio.Valor ?? Criterio.valor ?? "",
    })),
    Canciones: Detalle.Canciones,
  };

  El.Modal_Titulo.textContent = Album.Nombre;
  El.Modal_Artista.textContent = [
    Album.Artista,
    Album.Anio,
    Album.Genero,
  ].filter(Boolean).join(" / ");
  Render_Canciones_Modal();
  Render_Criterios_Modal();
  Actualizar_Resultado(null);
  El.Modal.showModal();
}

function Input_Numero({
  Valor = "",
  Min = 1,
  Max = 10,
  Step = "0.1",
} = {}) {
  const Input = document.createElement("input");
  Input.type = "number";
  Input.min = String(Min);
  Input.max = String(Max);
  Input.step = Step;
  Input.value = Valor === undefined || Valor === null
    ? ""
    : String(Valor);
  return Input;
}

function Render_Canciones_Modal() {
  const Album = Estado.Modal.Album;
  El.Lista_Canciones.innerHTML = "";

  if (!Album.Canciones.length) {
    const Vacio = document.createElement("div");
    Vacio.className = "Vacio";
    Vacio.textContent =
      "Este álbum no tiene partes/canciones en Semaplan.";
    El.Lista_Canciones.appendChild(Vacio);
    return;
  }

  Album.Canciones.forEach((Cancion) => {
    const Fila = document.createElement("div");
    Fila.className = "Cancion";
    Fila.dataset.id = Cancion.Id;

    const Nombre = document.createElement("div");
    Nombre.className = "Nombre_Cancion";
    const Titulo = document.createElement("strong");
    Titulo.textContent = Cancion.Nombre;
    const Meta = document.createElement("span");
    Meta.textContent = `${Formatear_Duracion(Cancion.Duracion_Segundos)} ` +
      `/ ${Cancion.Estado}`;
    Nombre.append(Titulo, Meta);

    const Duracion = document.createElement("span");
    Duracion.textContent = Formatear_Duracion(
      Cancion.Duracion_Segundos
    );

    const Score = Input_Numero({
      Valor: Estado.Modal.Canciones[Cancion.Id] ?? "",
    });
    Score.className = "Input_Cancion";
    Score.placeholder = "1-10";

    Fila.append(Nombre, Duracion, Score);
    El.Lista_Canciones.appendChild(Fila);
  });
}

function Render_Criterios_Modal() {
  El.Lista_Criterios.innerHTML = "";
  Estado.Modal.Criterios.forEach((Criterio, Indice) => {
    const Fila = document.createElement("div");
    Fila.className = "Criterio";
    Fila.dataset.indice = String(Indice);

    const Nombre = document.createElement("input");
    Nombre.value = Criterio.Nombre;
    Nombre.placeholder = "Criterio";
    Nombre.className = "Input_Criterio_Nombre";

    const Peso = Input_Numero({
      Valor: Criterio.Peso,
      Min: 0,
      Max: 100,
      Step: "0.1",
    });
    Peso.className = "Input_Criterio_Peso";
    Peso.placeholder = "Peso";

    const Valor = Input_Numero({
      Valor: Criterio.Valor,
    });
    Valor.className = "Input_Criterio_Valor";
    Valor.placeholder = "1-10";

    const Quitar = document.createElement("button");
    Quitar.className = "Quitar";
    Quitar.type = "button";
    Quitar.textContent = "×";
    Quitar.addEventListener("click", () => {
      Estado.Modal.Criterios.splice(Indice, 1);
      Render_Criterios_Modal();
    });

    Fila.append(Nombre, Peso, Valor, Quitar);
    El.Lista_Criterios.appendChild(Fila);
  });
}

function Leer_Criterios_Desde_Modal() {
  const Criterios = [];
  El.Lista_Criterios.querySelectorAll(".Criterio").forEach((Fila) => {
    const Nombre = Fila.querySelector(".Input_Criterio_Nombre")
      .value.trim();
    const Peso = Number(Fila.querySelector(".Input_Criterio_Peso").value);
    const Valor = Fila.querySelector(".Input_Criterio_Valor").value;
    if (!Nombre) return;
    Criterios.push({
      Nombre,
      Peso: Number.isFinite(Peso) && Peso > 0 ? Peso : 0,
      Valor,
    });
  });
  Estado.Modal.Criterios = Criterios;
  return Criterios;
}

function Leer_Canciones_Desde_Modal() {
  const Resultado = {};
  El.Lista_Canciones.querySelectorAll(".Cancion").forEach((Fila) => {
    const Id = Fila.dataset.id;
    const Valor = Fila.querySelector(".Input_Cancion").value;
    Resultado[Id] = Valor;
  });
  Estado.Modal.Canciones = Resultado;
  return Resultado;
}

function Calcular_Puntuacion() {
  const Album = Estado.Modal?.Album;
  if (!Album) throw new Error("No hay álbum activo.");
  if (!Album.Canciones.length) {
    throw new Error("El álbum no tiene canciones para ponderar.");
  }

  const Scores_Canciones = Leer_Canciones_Desde_Modal();
  const Criterios = Leer_Criterios_Desde_Modal();
  let Suma_Ponderada = 0;
  let Peso_Canciones = 0;

  Album.Canciones.forEach((Cancion) => {
    const Valor = Numero_Valido(Scores_Canciones[Cancion.Id]);
    if (Valor === null) {
      throw new Error(`Falta puntuar: ${Cancion.Nombre}`);
    }
    const Peso = Cancion.Duracion_Segundos > 0
      ? Cancion.Duracion_Segundos
      : 1;
    Suma_Ponderada += Valor * Peso;
    Peso_Canciones += Peso;
  });

  if (Peso_Canciones <= 0) {
    throw new Error("No hay duraciones válidas para las canciones.");
  }

  let Suma_Criterios = 0;
  let Peso_Criterios = 0;
  Criterios.forEach((Criterio) => {
    const Valor = Numero_Valido(Criterio.Valor);
    if (Valor === null) {
      throw new Error(`Falta puntuar criterio: ${Criterio.Nombre}`);
    }
    if (!Criterio.Peso || Criterio.Peso <= 0) {
      throw new Error(`Peso inválido en criterio: ${Criterio.Nombre}`);
    }
    Suma_Criterios += Valor * Criterio.Peso;
    Peso_Criterios += Criterio.Peso;
  });

  if (Peso_Criterios <= 0) {
    throw new Error("Agrega al menos un criterio general con peso.");
  }

  const Promedio_Canciones = Suma_Ponderada / Peso_Canciones;
  const Promedio_Criterios = Suma_Criterios / Peso_Criterios;
  const Final = (Promedio_Canciones * 0.8) +
    (Promedio_Criterios * 0.2);
  const Resultado = {
    Final: Math.round(Final * 100) / 100,
    Promedio_Canciones: Math.round(Promedio_Canciones * 100) / 100,
    Promedio_Criterios: Math.round(Promedio_Criterios * 100) / 100,
    Scores_Canciones,
    Criterios,
  };
  Actualizar_Resultado(Resultado);
  return Resultado;
}

function Actualizar_Resultado(Resultado) {
  if (!Resultado) {
    const Actual = Estado.Modal?.Album?.Puntuacion;
    El.Resultado_Puntuacion.textContent = Actual
      ? `Puntuación actual: ${Actual}`
      : "Sin puntuación fijada";
    El.Detalle_Puntuacion.textContent =
      "8 puntos canciones por duración + 2 puntos criterios.";
    return;
  }

  El.Resultado_Puntuacion.textContent =
    `Resultado: ${Resultado.Final.toFixed(2)}`;
  El.Detalle_Puntuacion.textContent =
    `Canciones ${Resultado.Promedio_Canciones.toFixed(2)} / ` +
    `criterios ${Resultado.Promedio_Criterios.toFixed(2)}`;
}

function Aplicar_Puntuacion_En_Estado(Estado_Base, Album, Resultado) {
  const Nuevo_Estado = Clonar(Estado_Base);
  const Sub = Nuevo_Estado.Planes_Periodo?.Subobjetivos?.[Album.Id];
  if (!Sub) {
    throw new Error("No se encontro el subobjetivo en el estado fresco.");
  }

  Sub.Metadatos = Sub.Metadatos && typeof Sub.Metadatos === "object"
    ? Sub.Metadatos
    : {};

  if (!Resultado) {
    delete Sub.Metadatos.Puntuacion;
    delete Sub.Metadatos.Puntuacion_Detalle;
  } else {
    Sub.Metadatos.Puntuacion = Resultado.Final.toFixed(2);
    Sub.Metadatos.Puntuacion_Detalle = JSON.stringify({
      Version: 1,
      Calculada_En: new Date().toISOString(),
      Regla: "80_canciones_por_duracion_20_criterios",
      Canciones: Resultado.Scores_Canciones,
      Criterios: Resultado.Criterios,
      Promedio_Canciones: Resultado.Promedio_Canciones,
      Promedio_Criterios: Resultado.Promedio_Criterios,
      Final: Resultado.Final,
    });
  }

  Nuevo_Estado.Sync_Datos_Marca_Ms = Date.now();
  return Nuevo_Estado;
}

async function Guardar_Estado_Remoto(Nuevo_Estado, Version_Actual) {
  const Url = `${Config_Semaplan.Url}/rest/v1/estado_usuario` +
    `?user_id=eq.${Estado.Sesion.User_Id}` +
    `&version=eq.${Version_Actual}`;
  const Filas = await Fetch_Json(Url, {
    method: "PATCH",
    headers: {
      ...Cabeceras_Supabase(Estado.Sesion.Access_Token),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      estado: Nuevo_Estado,
      version: Version_Actual + 1,
    }),
  });

  if (!Array.isArray(Filas) || !Filas.length) {
    throw new Error(
      "No se guardó: el estado remoto cambió antes de escribir."
    );
  }
  return Filas[0];
}

async function Fijar_Puntuacion() {
  const Resultado = Calcular_Puntuacion();
  const Album = Estado.Modal.Album;
  El.Fijar_Puntuacion.disabled = true;
  Set_Mensaje("Guardando puntuación en Semaplan...", "");

  try {
    const Fila_Fresca = await Leer_Fila_Semaplan();
    const Nuevo_Estado = Aplicar_Puntuacion_En_Estado(
      Fila_Fresca.estado || {},
      Album,
      Resultado
    );
    await Guardar_Estado_Remoto(
      Nuevo_Estado,
      Number(Fila_Fresca.version) || 1
    );
    await Cargar_Estado_Semaplan();
    Set_Mensaje("Puntuación fijada en Semaplan.", "Ok");
    El.Modal.close();
  } finally {
    El.Fijar_Puntuacion.disabled = false;
  }
}

async function Borrar_Puntuacion() {
  const Album = Estado.Modal?.Album;
  if (!Album) return;
  El.Borrar_Puntuacion.disabled = true;
  Set_Mensaje("Borrando puntuación en Semaplan...", "");

  try {
    const Fila_Fresca = await Leer_Fila_Semaplan();
    const Nuevo_Estado = Aplicar_Puntuacion_En_Estado(
      Fila_Fresca.estado || {},
      Album,
      null
    );
    await Guardar_Estado_Remoto(
      Nuevo_Estado,
      Number(Fila_Fresca.version) || 1
    );
    await Cargar_Estado_Semaplan();
    Set_Mensaje("Puntuación borrada en Semaplan.", "Ok");
    El.Modal.close();
  } finally {
    El.Borrar_Puntuacion.disabled = false;
  }
}

async function Crear_Melomania() {
  if (!Estado.Sesion) {
    throw new Error("Primero conectá Semaplan.");
  }

  El.Crear_Melomania.disabled = true;
  Set_Mensaje("Creando Melomanía en Semaplan...", "");

  try {
    const Fila_Fresca = await Leer_Fila_Semaplan();
    const Nuevo_Estado = Crear_Objetivo_Melomania_En_Estado(
      Fila_Fresca.estado || {}
    );
    await Guardar_Estado_Remoto(
      Nuevo_Estado,
      Number(Fila_Fresca.version) || 1
    );
    await Cargar_Estado_Semaplan();
    Set_Mensaje("Melomanía creada en Semaplan.", "Ok");
  } finally {
    El.Crear_Melomania.disabled = false;
  }
}

El.Form_Conexion.addEventListener("submit", async (Evento) => {
  Evento.preventDefault();
  const Email = El.Email.value.trim();
  const Password = El.Password.value;
  if (!Email || !Password) {
    Set_Mensaje("Completá email y contraseña.", "Error");
    return;
  }

  Set_Mensaje("Conectando con Semaplan...", "");
  Set_Estado_Semaplan("Conectando...", "Chip_Pendiente");
  try {
    Estado.Sesion = await Autenticar_Semaplan(Email, Password);
    El.Password.value = "";
    await Cargar_Estado_Semaplan();
    El.Actualizar.disabled = false;
    Set_Estado_Semaplan("Semaplan conectado", "Chip_Activo");
    Set_Mensaje(
      `Conectado como ${Estado.Sesion.Email}. ` +
      "Spotify y last.fm quedan pendientes.",
      "Ok"
    );
  } catch (Error) {
    Estado.Sesion = null;
    El.Actualizar.disabled = true;
    Set_Estado_Semaplan("Semaplan con error", "Chip_Error");
    Set_Mensaje(Error.message || String(Error), "Error");
  }
});

El.Spotify_Client_Id.addEventListener("input", () => {
  Estado.Spotify.Client_Id = El.Spotify_Client_Id.value.trim();
  localStorage.setItem(
    Storage_Keys.Spotify_Client_Id,
    Estado.Spotify.Client_Id
  );
});

El.Copiar_Redirect.addEventListener("click", async () => {
  await navigator.clipboard.writeText(El.Spotify_Redirect_Uri.value);
  Set_Mensaje("Redirect URI copiado.", "Ok");
});

El.Conectar_Spotify.addEventListener("click", async () => {
  try {
    await Iniciar_OAuth_Spotify();
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
  }
});

El.Form_Busqueda_Spotify.addEventListener("submit", async (Evento) => {
  Evento.preventDefault();
  const Query = El.Busqueda.value.trim();
  if (!Query) return;
  El.Buscar_Spotify.disabled = true;
  Set_Mensaje("Buscando álbumes en Spotify...", "");
  try {
    await Buscar_Albumes_Spotify(Query);
    Set_Mensaje("Resultados de Spotify actualizados.", "Ok");
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
  } finally {
    Render_Estado_Integraciones();
  }
});

El.Guardar_Biblioteca.addEventListener("click", async () => {
  try {
    await Guardar_Album_Seleccionado();
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
    Render_Estado_Integraciones();
  }
});

El.Conectar_Lastfm.addEventListener("click", async () => {
  try {
    await Conectar_Lastfm();
  } catch (Error) {
    Set_Estado_Lastfm("last.fm con error", "Chip_Error");
    Set_Mensaje(Error.message || String(Error), "Error");
  }
});

El.Lastfm_Usuario.addEventListener("input", Guardar_Config_Lastfm);
El.Lastfm_Api_Key.addEventListener("input", Guardar_Config_Lastfm);
El.Umbral_Escuchas.addEventListener("input", () => {
  const Valor = Math.max(1, Math.floor(Number(El.Umbral_Escuchas.value)));
  localStorage.setItem(Storage_Keys.Umbral_Escuchas, String(Valor));
});

El.Actualizar_Escuchas.addEventListener("click", async () => {
  try {
    await Actualizar_Escuchas_Lastfm();
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
    Render_Estado_Integraciones();
  }
});

El.Actualizar.addEventListener("click", async () => {
  Set_Mensaje("Actualizando biblioteca desde Semaplan...", "");
  try {
    await Cargar_Estado_Semaplan();
    Set_Mensaje("Biblioteca actualizada.", "Ok");
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
  }
});

El.Agregar_Criterio.addEventListener("click", () => {
  Leer_Criterios_Desde_Modal();
  Estado.Modal.Criterios.push({
    Nombre: "Nuevo criterio",
    Peso: 1,
    Valor: "",
  });
  Render_Criterios_Modal();
});

El.Calcular_Puntuacion.addEventListener("click", () => {
  try {
    Calcular_Puntuacion();
  } catch (Error) {
    El.Resultado_Puntuacion.textContent = "No se puede calcular";
    El.Detalle_Puntuacion.textContent = Error.message || String(Error);
  }
});

El.Fijar_Puntuacion.addEventListener("click", async () => {
  try {
    await Fijar_Puntuacion();
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
  }
});

El.Borrar_Puntuacion.addEventListener("click", async () => {
  try {
    await Borrar_Puntuacion();
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
  }
});

El.Crear_Melomania.addEventListener("click", async () => {
  try {
    await Crear_Melomania();
  } catch (Error) {
    Set_Mensaje(Error.message || String(Error), "Error");
  }
});

async function Inicializar_App() {
  Cargar_Config_Local();
  Render_Biblioteca();
  Render_Estado_Integraciones();
  try {
    await Procesar_Retorno_Spotify();
    if (Estado.Spotify.Tokens?.access_token && !Estado.Spotify.Perfil) {
      await Cargar_Perfil_Spotify();
    }
  } catch (Error) {
    Set_Estado_Spotify("Spotify con error", "Chip_Error");
    Set_Mensaje(Error.message || String(Error), "Error");
  } finally {
    Render_Estado_Integraciones();
  }
}

Inicializar_App();
