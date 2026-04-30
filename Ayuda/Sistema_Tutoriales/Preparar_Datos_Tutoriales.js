async () => {
  const Nombres_Tutorial = new Set([
    "Confirmar turno médico",
    "Respirar cinco minutos",
    "Ordenar papeles del estudio"
  ]);

  const Es_Tutorial = (Item) =>
    String(Item?.Id || "").startsWith("Tutorial_") ||
    Nombres_Tutorial.has(String(Item?.Nombre || "").trim()) ||
    Nombres_Tutorial.has(String(Item?.Texto || "").trim());

  const Parte_Fecha = (Numero) =>
    String(Numero).padStart(2, "0");

  const Fecha = (Dias = 0) => {
    const Valor = new Date();
    Valor.setHours(12, 0, 0, 0);
    Valor.setDate(Valor.getDate() + Dias);
    return `${Valor.getFullYear()}-` +
      `${Parte_Fecha(Valor.getMonth() + 1)}-` +
      `${Parte_Fecha(Valor.getDate())}`;
  };

  const Fecha_ISO = (Valor) =>
    `${Valor.getFullYear()}-` +
    `${Parte_Fecha(Valor.getMonth() + 1)}-` +
    `${Parte_Fecha(Valor.getDate())}`;

  const Hora_Texto = (Hora) =>
    `${Parte_Fecha(Math.floor(Hora))}:` +
    `${Parte_Fecha(Math.round((Hora % 1) * 60))}`;

  const Semana_Clave_Tutorial = () => {
    if (typeof Obtener_Lunes === "function" &&
        typeof Formatear_Fecha_ISO === "function") {
      Semana_Actual = Obtener_Lunes(new Date());
      return Formatear_Fecha_ISO(Semana_Actual);
    }
    return Fecha(0);
  };

  const Asegurar_Categoria = (Id, Nombre, Emoji, Color) => {
    Categorias = Array.isArray(Categorias) ? Categorias : [];
    let Categoria = Categorias.find((Item) => Item.Id === Id);
    if (!Categoria) {
      Categoria = { Id, Nombre, Emoji, Color_Baul: Color };
      Categorias.push(Categoria);
    }
    Categoria.Nombre = Nombre;
    Categoria.Emoji = Emoji;
    Categoria.Color_Baul = Color;
    return Categoria;
  };

  const Asegurar_Etiqueta = (Id, Nombre) => {
    Etiquetas = Array.isArray(Etiquetas) ? Etiquetas : [];
    let Etiqueta = Etiquetas.find((Item) => Item.Id === Id);
    if (!Etiqueta) {
      Etiqueta = { Id, Nombre };
      Etiquetas.push(Etiqueta);
    }
    Etiqueta.Nombre = Nombre;
    return Etiqueta;
  };

  const Limpiar_Datos_Tutorial = () => {
    Objetivos = (Array.isArray(Objetivos) ? Objetivos : [])
      .filter((Item) => !Es_Tutorial(Item));
    Eventos = (Array.isArray(Eventos) ? Eventos : [])
      .filter((Item) => !Es_Tutorial(Item));
    Tareas = (Array.isArray(Tareas) ? Tareas : [])
      .filter((Item) => !Es_Tutorial(Item));
    Habitos = (Array.isArray(Habitos) ? Habitos : [])
      .filter((Item) => !Es_Tutorial(Item));
    Habitos_Registros = (
      Array.isArray(Habitos_Registros) ? Habitos_Registros : []
    ).filter((Item) => !Es_Tutorial(Item));

    const Modelo = Asegurar_Modelo_Planes();
    ["Periodos", "Objetivos", "Subobjetivos", "Partes", "Avances"]
      .forEach((Clave) => {
        Object.keys(Modelo[Clave] || {}).forEach((Id) => {
          if (Id.startsWith("Tutorial_")) {
            delete Modelo[Clave][Id];
          }
        });
      });

    Object.keys(Planes_Slot || {}).forEach((Clave) => {
      const Items = Planes_Slot[Clave]?.Items || [];
      const Tiene_Tutorial = JSON.stringify(Items)
        .includes("Tutorial_");
      if (Clave.includes("Tutorial_") || Tiene_Tutorial) {
        delete Planes_Slot[Clave];
      }
    });

    Slots_Muertos = (Array.isArray(Slots_Muertos) ? Slots_Muertos : [])
      .filter((Clave) => !String(Clave).includes("Tutorial_"));
    Object.keys(Slots_Muertos_Tipos || {}).forEach((Clave) => {
      if (String(Slots_Muertos_Tipos[Clave]).startsWith("Tutorial_")) {
        Limpiar_Slot(Clave);
      }
    });
  };

  const Limpiar_Slot = (Clave) => {
    delete Planes_Slot[Clave];
    Slots_Muertos = (Array.isArray(Slots_Muertos) ? Slots_Muertos : [])
      .filter((Item) => Item !== Clave);
    delete Slots_Muertos_Tipos[Clave];
    delete Slots_Muertos_Nombres[Clave];
    delete Slots_Muertos_Titulos_Visibles[Clave];
    delete Slots_Muertos_Nombres_Auto[Clave];
    delete Slots_Muertos_Grupo_Ids[Clave];
  };

  const Crear_Objetivo_Tutorial = (Datos, Subobjetivos) => {
    const Semana = Semana_Clave_Tutorial();
    const Objetivo = Crear_Objetivo_Semanal_Con_Datos(Datos, Semana);
    Objetivo.Id = Datos.Id;
    Objetivo.Familia_Id = Datos.Id;
    Objetivo.Restante = Number(Datos.Horas_Semanales) || 0;
    const Lista = Obtener_Subobjetivos_Semana(Objetivo, true, Semana);
    Lista.splice(
      0,
      Lista.length,
      ...Subobjetivos.map((Sub, Indice) => ({
        Id: Sub.Id,
        Texto: Sub.Texto,
        Hecha: Boolean(Sub.Hecha),
        Orden: Indice
      }))
    );
    return Objetivo;
  };

  const Crear_Tarea_Tutorial = (Datos) => {
    const Tarea = Normalizar_Tarea({
      Estado: "pendiente",
      Fecha_Creacion: new Date().toISOString(),
      Fecha_Actualizacion: new Date().toISOString(),
      ...Datos
    });
    if (Tarea) {
      Tareas.push(Tarea);
    }
    return Tarea;
  };

  const Crear_Habito_Tutorial = (Datos) => {
    const Habito = Normalizar_Habito({
      Activo: true,
      Archivado: false,
      Fecha_Inicio: Fecha(-7),
      ...Datos
    });
    Habitos.push(Habito);
    return Habito;
  };

  const Crear_Registro_Habito = (Habito, Cantidad, Hora) => {
    const Hoy = Fecha(0);
    Habitos_Registros.push(Normalizar_Habito_Registro({
      Id: `Tutorial_Reg_${Habito.Id}`,
      Habito_Id: Habito.Id,
      Fecha: Hoy,
      Hora,
      Fecha_Hora: `${Hoy}T${Hora}`,
      Periodo_Clave: typeof Habito_Clave_Periodo === "function"
        ? Habito_Clave_Periodo(Habito, Hoy)
        : Hoy,
      Fuente: "Tutorial",
      Fuente_Id: "Ayuda",
      Cantidad,
      Unidad: Habito.Meta?.Unidad || "",
      Nota: "Ejemplo cargado para el tutorial"
    }));
  };

  const Crear_Evento_Tutorial = (Datos) => {
    const Objetivo = Objetivo_Por_Id(Datos.Objetivo_Id);
    const Evento = Meta_Aporte_Preparar_Evento({
      Hecho: false,
      Color: Objetivo?.Color || Datos.Color || "#5f9c8d",
      ...Datos
    }, Objetivo);
    Eventos.push(Evento);
    return Evento;
  };

  const Crear_Datos_Planes = () => {
    const Modelo = Asegurar_Modelo_Planes();
    const Ahora = new Date();
    const Trimestre = Math.floor(Ahora.getMonth() / 3);
    const Inicio_Trimestre = new Date(
      Ahora.getFullYear(),
      Trimestre * 3,
      1
    );
    const Fin_Trimestre = new Date(
      Ahora.getFullYear(),
      Trimestre * 3 + 3,
      0
    );
    const Inicio_Periodo = Fecha_ISO(Inicio_Trimestre);
    const Fin_Periodo = Fecha_ISO(Fin_Trimestre);
    const Periodo_Id = typeof Plan_Periodo_Id === "function"
      ? Plan_Periodo_Id("Trimestre", Inicio_Periodo, Fin_Periodo)
      : `P_Trimestre_${Inicio_Periodo}_${Fin_Periodo}`;
    const Obj_Onboarding = "Tutorial_Plan_Obj_Onboarding";
    const Obj_Salud = "Tutorial_Plan_Obj_Salud";
    const Sub_Guion = "Tutorial_Plan_Sub_Guion";
    const Sub_Video = "Tutorial_Plan_Sub_Video";
    const Sub_Chequeo = "Tutorial_Plan_Sub_Chequeo";
    const Parte_Indice = "Tutorial_Plan_Parte_Indice";
    const Parte_Borrador = "Tutorial_Plan_Parte_Borrador";

    Modelo.Periodos[Periodo_Id] = Normalizar_Periodo_Plan({
      Id: Periodo_Id,
      Tipo: "Trimestre",
      Inicio: Inicio_Periodo,
      Fin: Fin_Periodo,
      Titulo: "Trimestre de crecimiento",
      Resumen: "Un período de ejemplo con metas, avances y partes.",
      Estado: "Activo",
      Orden: 1
    });

    Modelo.Objetivos[Obj_Onboarding] = Normalizar_Objetivo_Plan({
      Id: Obj_Onboarding,
      Periodo_Id,
      Nombre: "Lanzar guía de onboarding",
      Descripcion: "Preparar materiales para ayudar a nuevos usuarios.",
      Emoji: "🚀",
      Color: "#5f9c8d",
      Target_Total: 12,
      Target_Actual: 12,
      Unidad: "Horas",
      Modo_Progreso: "Hibrido",
      Modo_Avance: "Metrica",
      Fecha_Inicio: Fecha(-5),
      Fecha_Objetivo: Fecha(45),
      Tags: ["Cliente", "Focus"]
    });

    Modelo.Objetivos[Obj_Salud] = Normalizar_Objetivo_Plan({
      Id: Obj_Salud,
      Periodo_Id,
      Nombre: "Sostener rutina de salud",
      Descripcion: "Mantener controles, caminatas y descanso semanal.",
      Emoji: "🩺",
      Color: "#d47f64",
      Target_Total: 8,
      Target_Actual: 8,
      Unidad: "Personalizado",
      Unidad_Custom: "sesiones",
      Modo_Progreso: "Hibrido",
      Modo_Avance: "Metrica",
      Fecha_Inicio: Fecha(-5),
      Fecha_Objetivo: Fecha(60),
      Tags: ["Salud"]
    });

    Modelo.Subobjetivos[Sub_Guion] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Guion,
      Objetivo_Id: Obj_Onboarding,
      Emoji: "📝",
      Texto: "Escribir guion principal",
      Target_Total: 4,
      Unidad: "Horas",
      Progreso_Manual: 1,
      Aporte_Meta: 4,
      Fecha_Objetivo: Fecha(14)
    });

    Modelo.Subobjetivos[Sub_Video] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Video,
      Objetivo_Id: Obj_Onboarding,
      Emoji: "🎬",
      Texto: "Grabar video de bienvenida",
      Target_Total: 3,
      Unidad: "Horas",
      Progreso_Manual: 0,
      Aporte_Meta: 3,
      Fecha_Objetivo: Fecha(28)
    });

    Modelo.Subobjetivos[Sub_Chequeo] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Chequeo,
      Objetivo_Id: Obj_Salud,
      Emoji: "🩺",
      Texto: "Completar chequeo médico",
      Target_Total: 1,
      Unidad: "Personalizado",
      Unidad_Custom: "sesión",
      Progreso_Manual: 1,
      Aporte_Meta: 1,
      Hecha: true,
      Estado: "Cumplido",
      Fecha_Objetivo: Fecha(7)
    });

    Modelo.Partes[Parte_Indice] = Normalizar_Parte_Meta({
      Id: Parte_Indice,
      Objetivo_Id: Obj_Onboarding,
      Subobjetivo_Id: Sub_Guion,
      Emoji: "📑",
      Nombre: "Índice",
      Aporte_Total: 1,
      Unidad: "Horas",
      Progreso_Avances: 1,
      Estado: "Realizada"
    });

    Modelo.Partes[Parte_Borrador] = Normalizar_Parte_Meta({
      Id: Parte_Borrador,
      Objetivo_Id: Obj_Onboarding,
      Subobjetivo_Id: Sub_Guion,
      Emoji: "✍️",
      Nombre: "Borrador",
      Aporte_Total: 3,
      Unidad: "Horas",
      Progreso_Avances: 1,
      Estado: "Parcial"
    });

    Modelo.Avances.Tutorial_Plan_Avance_Guion =
      Normalizar_Avance_Plan({
        Id: "Tutorial_Plan_Avance_Guion",
        Objetivo_Id: Obj_Onboarding,
        Subobjetivo_Id: Sub_Guion,
        Parte_Id: Parte_Borrador,
        Fuente: "Manual",
        Cantidad: 1,
        Unidad: "Horas",
        Fecha: Fecha(-1),
        Hora: "10:30",
        Nota: "Primer borrador revisado"
      });

    Modelo.Avances.Tutorial_Plan_Avance_Chequeo =
      Normalizar_Avance_Plan({
        Id: "Tutorial_Plan_Avance_Chequeo",
        Objetivo_Id: Obj_Salud,
        Subobjetivo_Id: Sub_Chequeo,
        Fuente: "Manual",
        Cantidad: 1,
        Unidad: "sesión",
        Fecha: Fecha(0),
        Hora: "09:00",
        Nota: "Turno médico completado"
      });

    Modelo.UI.Periodo_Activo_Id = Periodo_Id;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Vista = "Tarjetas";
    Modelo.UI.Anio_Activo = new Date().getFullYear();
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Subperiodo_Activo =
      Math.floor(new Date().getMonth() / 3) + 1;

    Planes_Asegurar_Progreso_Calculado(Modelo);
    Object.values(Modelo.Objetivos).forEach((Objetivo) => {
      if (Es_Tutorial(Objetivo)) {
        Planes_Actualizar_Progreso(Objetivo);
      }
    });
  };

  const Crear_Datos_Slots = () => {
    if (!Obtener_Tipos_Slot()
      .some((Tipo) => Tipo.Id === "Tutorial_Tipo_Trabajo_Profundo")) {
      Tipos_Slot = Obtener_Tipos_Slot();
      Tipos_Slot.push(Normalizar_Tipo_Slot({
        Id: "Tutorial_Tipo_Trabajo_Profundo",
        Nombre: "Trabajo profundo",
        Color: "#5f9c8d",
        Titulo: "Trabajo profundo",
        Titulo_Por_Defecto: true
      }));
      Tipos_Slot_Inicializados = true;
    }

    const Slot_Vacio = Clave_Slot(Fecha(2), 16);
    const Slot_Muerto = Clave_Slot(Fecha(3), 13);
    Limpiar_Slot(Slot_Vacio);
    Limpiar_Slot(Slot_Muerto);

    const Items_Vacio = [
      Crear_Item_Tarea_Plan_Slot(
        Tareas.find((Item) => Item.Id === "Tutorial_Tarea_Presupuesto")
      ),
      Crear_Item_Habito_Plan_Slot(
        Habito_Por_Id("Tutorial_Habito_Agua")
      )
    ].filter(Boolean);
    Guardar_Plan_Slot_Clave(Slot_Vacio, Items_Vacio);

    Crear_Slot_Muerto(
      Fecha(3),
      13,
      "Tutorial_Tipo_Trabajo_Profundo",
      true,
      "Tutorial_Grupo_Slot_Muerto"
    );
    Guardar_Nombre_Slot_Muerto(
      Slot_Muerto,
      "Trabajo profundo",
      true,
      true
    );
    Guardar_Plan_Slot_Clave(Slot_Muerto, [
      Crear_Item_Habito_Plan_Slot(
        Habito_Por_Id("Tutorial_Habito_Caminar")
      )
    ].filter(Boolean));
  };

  Limpiar_Datos_Tutorial();
  const Trabajo = Asegurar_Categoria(
    "Tutorial_Cat_Trabajo",
    "Trabajo profundo",
    "💼",
    "#5f9c8d"
  );
  const Salud = Asegurar_Categoria(
    "Tutorial_Cat_Salud",
    "Salud y energía",
    "🩺",
    "#d47f64"
  );
  const Aprendizaje = Asegurar_Categoria(
    "Tutorial_Cat_Aprendizaje",
    "Aprendizaje",
    "🎓",
    "#6f91d8"
  );
  const Cliente = Asegurar_Etiqueta("Tutorial_Tag_Cliente", "Cliente");
  const Tag_Salud = Asegurar_Etiqueta("Tutorial_Tag_Salud", "Salud");
  const Estudio = Asegurar_Etiqueta("Tutorial_Tag_Estudio", "Estudio");
  const Focus = Asegurar_Etiqueta("Tutorial_Tag_Focus", "Focus");

  const Obj_Propuesta = Crear_Objetivo_Tutorial({
    Id: "Tutorial_Obj_Propuesta",
    Nombre: "Preparar propuesta comercial",
    Descripcion_Corta: "Armar una propuesta clara para una reunión.",
    Emoji: "💼",
    Color: "#5f9c8d",
    Horas_Semanales: 4,
    Es_Bolsa: true,
    Categoria_Id: Trabajo.Id,
    Etiquetas_Ids: [Cliente.Id, Focus.Id]
  }, [
    {
      Id: "Tutorial_Sub_Indice",
      Texto: "Armar índice de la propuesta"
    },
    {
      Id: "Tutorial_Sub_Presupuesto",
      Texto: "Revisar presupuesto"
    },
    {
      Id: "Tutorial_Sub_Envio",
      Texto: "Enviar versión final"
    }
  ]);

  Crear_Objetivo_Tutorial({
    Id: "Tutorial_Obj_Estudio",
    Nombre: "Estudiar fotografía",
    Descripcion_Corta: "Practicar edición y composición con fotos reales.",
    Emoji: "📷",
    Color: "#6f91d8",
    Horas_Semanales: 3,
    Es_Bolsa: true,
    Categoria_Id: Aprendizaje.Id,
    Etiquetas_Ids: [Estudio.Id]
  }, [
    { Id: "Tutorial_Sub_Clase", Texto: "Elegir clase" },
    { Id: "Tutorial_Sub_Edicion", Texto: "Practicar edición" }
  ]);

  Crear_Objetivo_Tutorial({
    Id: "Tutorial_Obj_Salud",
    Nombre: "Cuidar salud semanal",
    Descripcion_Corta: "Ordenar controles y sostener caminatas suaves.",
    Emoji: "🩺",
    Color: "#d47f64",
    Horas_Semanales: 2,
    Es_Bolsa: true,
    Categoria_Id: Salud.Id,
    Etiquetas_Ids: [Tag_Salud.Id]
  }, [
    {
      Id: "Tutorial_Sub_Chequeo",
      Texto: "Agendar chequeo médico",
      Hecha: true
    },
    {
      Id: "Tutorial_Sub_Estudios",
      Texto: "Preparar estudios previos"
    }
  ]);

  Tareas_Cajones_Definidos = [
    ...new Set([
      ...(Array.isArray(Tareas_Cajones_Definidos)
        ? Tareas_Cajones_Definidos
        : []),
      "Clientes",
      "Salud",
      "Administración"
    ])
  ];

  Crear_Tarea_Tutorial({
    Id: "Tutorial_Tarea_Presupuesto",
    Emoji: "✉️",
    Nombre: "Enviar presupuesto a Clara",
    Cajon: "Clientes",
    Prioridad: "alta",
    Fecha: Fecha(1),
    Hora: "11:00"
  });
  Crear_Tarea_Tutorial({
    Id: "Tutorial_Tarea_Llamar",
    Emoji: "📞",
    Nombre: "Llamar a la clínica",
    Cajon: "Salud",
    Prioridad: "media",
    Fecha: Fecha(0),
    Hora: "17:00"
  });
  Crear_Tarea_Tutorial({
    Id: "Tutorial_Tarea_Backup",
    Emoji: "💾",
    Nombre: "Revisar backup semanal",
    Cajon: "Administración",
    Prioridad: "baja",
    Fecha: Fecha(2),
    Hora: ""
  });
  Normalizar_Tareas();

  const Agua = Crear_Habito_Tutorial({
    Id: "Tutorial_Habito_Agua",
    Nombre: "Tomar agua",
    Emoji: "💧",
    Tipo: "Hacer",
    Programacion: { Tipo: "Horas", Horas: [9, 15] },
    Meta: {
      Modo: "Cantidad",
      Regla: "Al_Menos",
      Periodo: "Dia",
      Cantidad: 2,
      Unidad: "vasos"
    }
  });
  const Caminar = Crear_Habito_Tutorial({
    Id: "Tutorial_Habito_Caminar",
    Nombre: "Caminar veinte minutos",
    Emoji: "🚶",
    Tipo: "Hacer",
    Programacion: { Tipo: "Dias", Dias: [1, 3, 5] },
    Meta: {
      Modo: "Tiempo",
      Regla: "Al_Menos",
      Periodo: "Dia",
      Cantidad: 20,
      Unidad: "Minutos"
    }
  });
  Crear_Habito_Tutorial({
    Id: "Tutorial_Habito_Redes",
    Nombre: "Evitar redes antes de dormir",
    Emoji: "🌙",
    Tipo: "Evitar",
    Programacion: { Tipo: "Libre" },
    Meta: {
      Modo: "Cantidad",
      Regla: "Como_Maximo",
      Periodo: "Dia",
      Cantidad: 0,
      Unidad: "veces"
    }
  });
  Normalizar_Habitos();
  Crear_Registro_Habito(Agua, 1, "09:15");
  Crear_Registro_Habito(Caminar, 20, "08:30");
  Normalizar_Habitos_Registros();

  Crear_Datos_Planes();
  if (typeof Plan_Modal_Modo !== "undefined") {
    Plan_Modal_Modo = "Periodos";
  }

  const Hora_Actual = new Date();
  const Inicio_Focus = Math.max(
    6,
    Math.floor(
      (
        Hora_Actual.getHours() +
        Hora_Actual.getMinutes() / 60 -
        0.25
      ) * 2
    ) / 2
  );
  Crear_Evento_Tutorial({
    Id: "Tutorial_Evento_Propuesta",
    Objetivo_Id: "Tutorial_Obj_Propuesta",
    Fecha: Fecha(0),
    Inicio: 10,
    Duracion: 1,
    Hecho: true
  });
  Crear_Evento_Tutorial({
    Id: "Tutorial_Evento_Estudio",
    Objetivo_Id: "Tutorial_Obj_Estudio",
    Fecha: Fecha(1),
    Inicio: 11,
    Duracion: 1,
    Hecho: false
  });
  Crear_Evento_Tutorial({
    Id: "Tutorial_Evento_Focus",
    Objetivo_Id: Obj_Propuesta.Id,
    Fecha: Fecha(0),
    Inicio: Inicio_Focus,
    Duracion: 1.5,
    Hecho: false
  });

  Crear_Datos_Slots();

  Config.Menu_Estilo = "Iconos";
  if (typeof Aplicar_Estilo_Menu === "function") {
    Aplicar_Estilo_Menu();
  }
  if (typeof Render_Calendario === "function") {
    Render_Calendario();
  }
  if (typeof Render_Eventos === "function") {
    Render_Eventos();
  }
  if (typeof Render_Emojis === "function") {
    Render_Emojis();
  }
  if (typeof Render_Resumen_Objetivo === "function") {
    Objetivo_Seleccionada_Id = "Tutorial_Obj_Propuesta";
    Render_Resumen_Objetivo();
  }
  if (typeof Render_Tareas_Contador === "function") {
    Render_Tareas_Contador();
  }
  if (typeof Render_Habitos_Sidebar === "function") {
    Render_Habitos_Sidebar();
  }
  if (typeof Render_Plan === "function") {
    Render_Plan();
  }

  Guardar_Estado();
  try {
    if (typeof Forzar_Sync_Inmediato_Cambio_Critico === "function") {
      await Forzar_Sync_Inmediato_Cambio_Critico();
    }
  } catch (Error) {
    console.warn("No se pudo sincronizar antes de grabar", Error);
  }
}
