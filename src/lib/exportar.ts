"use client";

/**
 * Exportación de datos del panel a CSV.
 *
 * Se genera en el navegador a propósito: el sitio es estático, no hay servidor
 * que pueda armar el archivo, y los datos ya están cargados en memoria para
 * pintar las tablas. Bajar un CSV es entonces un paso de formato, no una
 * consulta nueva.
 *
 * Dos decisiones que parecen manías y no lo son:
 *
 *  - Separador de punto y coma. Excel en español interpreta la coma como
 *    separador decimal, así que un CSV de comas le llega todo en una columna.
 *  - BOM al principio. Sin él, Excel abre el archivo como Latin-1 y los
 *    apellidos del pueblo salen con los acentos rotos.
 */

import { ETIQUETA_TIPO, formatearTelefono } from "./formato";
import { estaVigente } from "./publicaciones";
import { esPermanente, type Miembro, type Publicacion, type PublicacionDivisa } from "./types";

type Celda = string | number | boolean | null | undefined;

/**
 * Escapa una celda.
 *
 * Un valor que empieza por =, +, - o @ se prefija con un apóstrofo: sin eso,
 * Excel lo interpreta como fórmula. Un nombre escrito como `=1+1` es una
 * curiosidad; uno escrito para llamar a una función del sistema es una
 * inyección, y el archivo lo abriría la administración en su propio equipo.
 */
function celda(valor: Celda): string {
  if (valor === null || valor === undefined) return "";
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  if (/[";\n\r]/.test(texto)) texto = `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

/** Fecha y hora en formato local, legible en la hoja de cálculo. */
function fecha(marca: number | undefined): string {
  if (!marca || !Number.isFinite(marca)) return "";
  return new Date(marca).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function armarCsv(cabeceras: string[], filas: Celda[][]): string {
  return [cabeceras, ...filas].map((fila) => fila.map(celda).join(";")).join("\r\n");
}

/** Lanza la descarga del archivo en el navegador. */
function descargar(nombre: string, contenido: string): void {
  const marca = new Date().toISOString().slice(0, 10);
  // El ﻿ es el BOM que le dice a Excel que esto viene en UTF-8.
  const blob = new Blob([`﻿${contenido}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombre}-${marca}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  // Sin revocar, el blob se queda en memoria hasta que se cierre la pestaña.
  URL.revokeObjectURL(url);
}

export function exportarMiembros(miembros: Miembro[]): void {
  descargar(
    "miembros-mara-comercio",
    armarCsv(
      [
        "Código",
        "Nombre",
        "Apellido",
        "Teléfono",
        "WhatsApp",
        "Sector",
        "Verificado",
        "Vendedor Seguro",
        "Pidió verificación",
        "Se registró",
      ],
      miembros.map((m) => [
        m.codigo,
        m.nombre,
        m.apellido,
        formatearTelefono(m.telefono),
        `+${m.telefono}`,
        m.zona,
        m.verificado ? "Sí" : "No",
        m.vendedorSeguro ? "Sí" : "No",
        !m.verificado && m.solicitaVerificacion ? "Sí" : "No",
        fecha(m.creadoEn),
      ]),
    ),
  );
}

export function exportarPublicaciones(publicaciones: Publicacion[], ahora: number): void {
  descargar(
    "publicaciones-mara-comercio",
    armarCsv(
      [
        "Tipo",
        "Título",
        "Sector",
        "Categoría",
        "Precio o tasa",
        "Estado",
        "Vigente",
        "Autor",
        "Código del autor",
        "Teléfono",
        "Creada",
        "Vence",
        "Prórrogas",
      ],
      publicaciones.map((p) => [
        ETIQUETA_TIPO[p.tipo],
        p.titulo,
        p.zona,
        p.tipo === "negocio"
          ? (p.categorias?.length ? p.categorias : [p.categoria]).join(" · ")
          : "categoria" in p
            ? p.categoria
            : p.tipo === "divisa"
              ? p.divisa
              : "",
        precioLegible(p),
        p.estado,
        estaVigente(p, ahora) ? "Sí" : "No",
        `${p.autorNombre} ${p.autorApellido}`.trim(),
        p.autorCodigo,
        `+${p.autorTelefono}`,
        fecha(p.creadaEn),
        esPermanente(p.tipo) ? "no vence" : fecha(p.venceEn),
        p.prorrogas ?? 0,
      ]),
    ),
  );
}

/**
 * El número que define cada publicación, sea lo que sea ese número.
 *
 * Se deja crudo, sin símbolos ni separadores de miles: la hoja de cálculo lo
 * quiere como número para poder sumarlo, no como texto ya maquetado.
 */
function precioLegible(p: Publicacion): Celda {
  switch (p.tipo) {
    case "producto":
      return p.precio;
    case "mototaxi":
      return p.tarifaDesde;
    case "rifa":
      return p.precioNumero;
    case "divisa":
      return (p as PublicacionDivisa).tasa;
    default:
      return "";
  }
}
