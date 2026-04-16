const fs = require("fs");
const path = require("path");

const { Parsear_Args } = require("./lib/supabase-operativo");

const Entornos = {
  produccion: "cprdnxkkhuuhdispubds",
  staging: "cukkxjmdspbefkqzjumh"
};

const Logo_Url =
  "https://semaplan.com/Aplicaciones/Desktop/Semaplan.png";

const Campos = [
  "mailer_subjects_recovery",
  "mailer_templates_confirmation_content",
  "mailer_templates_email_change_content",
  "mailer_templates_invite_content",
  "mailer_templates_magic_link_content",
  "mailer_templates_recovery_content"
];

const Campos_Con_Logo = Campos.filter((Campo) => {
  return Campo.endsWith("_content");
});

function Leer_Token() {
  const Ruta = path.join(
    process.cwd(),
    "Local",
    "Credenciales.txt"
  );
  const Texto = fs.existsSync(Ruta)
    ? fs.readFileSync(Ruta, "utf8")
    : "";
  return process.env.SEMAPLAN_SUPABASE_ACCESS_TOKEN ||
    process.env.SUPABASE_ACCESS_TOKEN ||
    Texto.match(/sbp_[A-Za-z0-9_-]+/)?.[0] ||
    "";
}

function Header_Marca() {
  return [
    '      <tr><td align="center"',
    '        style="padding-bottom:24px;">',
    '        <table cellpadding="0" cellspacing="0"',
    '          role="presentation" align="center">',
    "          <tr>",
    '            <td style="padding-right:10px;',
    '              vertical-align:middle;">',
    `              <img src="${Logo_Url}"`,
    '                width="32" height="32"',
    '                alt="Semaplan"',
    '                style="display:block;border:0;',
    '                border-radius:8px;" />',
    "            </td>",
    '            <td style="font-size:28px;',
    '              line-height:32px;font-weight:700;',
    '              color:#1f1f1f;vertical-align:middle;">',
    "              Semaplan",
    "            </td>",
    "          </tr>",
    "        </table>",
    "      </td></tr>"
  ].join("\n");
}

function Plantilla({
  Titulo,
  Texto,
  Boton,
  Pie
}) {
  return [
    '<table width="100%" cellpadding="0" cellspacing="0"',
    '  style="background:#f3efe7;padding:40px 0;',
    "  font-family:'Space Grotesk','Segoe UI',",
    '  sans-serif;">',
    "  <tr><td align=\"center\">",
    '    <table width="420" cellpadding="0"',
    '      cellspacing="0" style="background:#fbf7f0;',
    '      border-radius:16px;padding:40px;',
    '      border:1px solid #d9cfc0;">',
    Header_Marca(),
    ...(Titulo ? [
      '      <tr><td style="color:#1f1f1f;',
      '        font-size:16px;line-height:1.6;',
      '        padding-bottom:8px;">',
      `        ${Titulo}`,
      "      </td></tr>"
    ] : []),
    '      <tr><td style="color:#6a6257;',
    '        font-size:14px;line-height:1.6;',
    '        padding-bottom:24px;">',
    ...Texto.map((Linea) => `        ${Linea}`),
    "      </td></tr>",
    '      <tr><td align="center"',
    '        style="padding-bottom:24px;">',
    '        <a href="{{ .ConfirmationURL }}"',
    '          style="display:inline-block;',
    '          background:#0f5f5a;color:#fff;',
    '          font-size:14px;font-weight:600;',
    '          padding:12px 32px;',
    '          border-radius:999px;',
    '          text-decoration:none;">',
    `          ${Boton}`,
    "        </a>",
    "      </td></tr>",
    '      <tr><td style="color:#6a6257;',
    '        font-size:12px;line-height:1.5;',
    '        border-top:1px solid #d9cfc0;',
    '        padding-top:16px;">',
    ...Pie.map((Linea) => `        ${Linea}`),
    "      </td></tr>",
    "    </table>",
    "  </td></tr>",
    "</table>"
  ].join("\n");
}

function Construir_Plantillas() {
  return {
    mailer_subjects_recovery: "Nuevo acceso a Semaplan",
    mailer_templates_confirmation_content: Plantilla({
      Titulo: "Confirmá tu cuenta",
      Texto: [
        "Hacé clic en el botón para verificar",
        "tu email y activar tu cuenta."
      ],
      Boton: "Confirmar email",
      Pie: [
        "Si no creaste una cuenta en Semaplan,",
        "ignorá este mensaje."
      ]
    }),
    mailer_templates_email_change_content: Plantilla({
      Titulo: "Confirmar nuevo email",
      Texto: [
        "Hacé clic en el botón para confirmar",
        "el cambio de email de tu cuenta."
      ],
      Boton: "Confirmar email",
      Pie: [
        "Si no solicitaste este cambio,",
        "ignorá este mensaje."
      ]
    }),
    mailer_templates_invite_content: Plantilla({
      Titulo: "Te invitaron a Semaplan",
      Texto: [
        "Hacé clic en el botón para aceptar",
        "la invitación y crear tu cuenta."
      ],
      Boton: "Aceptar invitación",
      Pie: [
        "Si no esperabas esta invitación,",
        "ignorá este mensaje."
      ]
    }),
    mailer_templates_magic_link_content: Plantilla({
      Titulo: "Tu link de acceso",
      Texto: [
        "Hacé clic en el botón para",
        "iniciar sesión en tu cuenta."
      ],
      Boton: "Iniciar sesión",
      Pie: [
        "Si no solicitaste este link,",
        "ignorá este mensaje."
      ]
    }),
    mailer_templates_recovery_content: Plantilla({
      Titulo: "",
      Texto: [
        "Hacé click en el botón."
      ],
      Boton: "Nueva contraseña",
      Pie: [
        "Si no lo pediste, ignoralo."
      ]
    })
  };
}

async function Fetch_Config(Ref, Token, Opciones = {}) {
  const Resp = await fetch(
    `https://api.supabase.com/v1/projects/${Ref}/config/auth`,
    {
      ...Opciones,
      headers: {
        Authorization: `Bearer ${Token}`,
        "Content-Type": "application/json",
        ...(Opciones.headers || {})
      }
    }
  );
  if (!Resp.ok) {
    const Texto = await Resp.text().catch(() => "");
    throw new Error(
      `Supabase respondio ${Resp.status}: ${Texto}`
    );
  }
  return Resp.json();
}

function Resolver_Entornos(Valor) {
  const Nombre = String(Valor || "produccion").toLowerCase();
  if (Nombre === "todos") {
    return Object.entries(Entornos);
  }
  if (!Entornos[Nombre]) {
    throw new Error(
      "Entorno invalido. Usar produccion, staging o todos."
    );
  }
  return [[Nombre, Entornos[Nombre]]];
}

async function Actualizar_Entorno(Nombre, Ref, Token, Aplicar) {
  const Plantillas = Construir_Plantillas();
  const Actual = await Fetch_Config(Ref, Token);
  const Cambios = Campos.filter((Campo) => {
    return Actual[Campo] !== Plantillas[Campo];
  });

  if (!Cambios.length) {
    console.log(`${Nombre}: sin cambios`);
    return;
  }
  console.log(
    `${Nombre}: ${Cambios.length} plantillas para actualizar`
  );
  if (!Aplicar) {
    console.log(`${Nombre}: dry-run, usar --aplicar para guardar`);
    return;
  }

  await Fetch_Config(Ref, Token, {
    method: "PATCH",
    body: JSON.stringify(Plantillas)
  });

  const Verificada = await Fetch_Config(Ref, Token);
  const Faltantes = Campos_Con_Logo.filter((Campo) => {
    const Valor = String(Verificada[Campo] || "");
    return !Valor.includes("<img") || !Valor.includes(Logo_Url);
  });
  if (Faltantes.length) {
    throw new Error(
      `${Nombre}: faltan logos en ${Faltantes.join(", ")}`
    );
  }
  console.log(`${Nombre}: plantillas actualizadas con logo`);
}

async function Main() {
  const Args = Parsear_Args();
  const Token = Leer_Token();
  if (!Token) {
    throw new Error(
      "Falta SEMAPLAN_SUPABASE_ACCESS_TOKEN o token local."
    );
  }
  const Lista = Resolver_Entornos(Args.entorno);
  const Aplicar = Boolean(Args.aplicar);
  for (const [Nombre, Ref] of Lista) {
    await Actualizar_Entorno(Nombre, Ref, Token, Aplicar);
  }
}

Main().catch((Error) => {
  console.error(Error.message || Error);
  process.exit(1);
});
