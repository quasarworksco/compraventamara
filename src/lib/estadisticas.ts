/**
 * Las cuentas del panel de administración.
 *
 * Todo lo de aquí son funciones puras sobre las listas que ya trae Firestore:
 * ni una lectura extra, ni un `Date.now()` escondido. La hora entra como
 * argumento para que el mismo conjunto de datos dé siempre el mismo resultado
 * —eso es lo que permite probarlo— y para que el panel no se repinte solo a
 * mitad de un renderizado.
 *
 * La idea que ordena el archivo: un panel no sirve para ver números bonitos,
 * sino para decidir. Por eso casi cada cifra tiene una acción detrás —a quién
 * verificar, qué sector está vacío, quién sostiene el tablón de divisas—.
 */

import { ETIQUETA_TIPO } from "./formato";
import { estaVigente } from "./publicaciones";
import {
  MS_POR_DIA,
  esPermanente,
  type Miembro,
  type Publicacion,
  type PublicacionDivisa,
  type TipoPublicacion,
} from "./types";

/** Un punto de cualquiera de los gráficos: una etiqueta y un número. */
export interface Punto {
  etiqueta: string;
  valor: number;
  /** Texto largo para el tooltip, cuando la etiqueta va abreviada. */
  detalle?: string;
}

export interface Resumen {
  miembros: {
    total: number;
    verificados: number;
    seguros: number;
    esperando: number;
    nuevos30: number;
    nuevos7: number;
    /** Cuántos han publicado alguna vez. El resto solo mira. */
    activos: number;
  };
  publicaciones: {
    total: number;
    activas: number;
    vencidas: number;
    /** Anuncios que su dueño cerró diciendo que ya lo vendió. */
    cerradas: number;
    cerradas30: number;
    /** Cuántas van destacadas ahora mismo: lo que se está cobrando. */
    destacadas: number;
    nuevas30: number;
    nuevas7: number;
    porTipo: Punto[];
  };
  divisas: {
    ofertasVivas: number;
    cambistas: number;
    /** Tasa media de venta de dólares entre las ofertas vivas. */
    tasaVentaUsd: number | null;
    tasaCompraUsd: number | null;
  };
  /** Actividad diaria: publicaciones creadas cada día. */
  actividad: Punto[];
  /** Registros por día, en la misma rejilla de fechas que `actividad`. */
  registros: Punto[];
  zonas: Punto[];
  categorias: Punto[];
  /** Quién sostiene la plataforma, por número de publicaciones. */
  masActivos: { miembro: Miembro | null; nombre: string; codigo: string; total: number }[];
}

/** Días que abarcan la tendencia del panel. */
export const DIAS_TENDENCIA = 30;

const ORDEN_TIPOS: TipoPublicacion[] = ["producto", "negocio", "mototaxi", "divisa", "rifa"];

/** Comienzo del día local de una marca de tiempo. */
function inicioDelDia(marca: number): number {
  const fecha = new Date(marca);
  fecha.setHours(0, 0, 0, 0);
  return fecha.getTime();
}

/** "4 oct", para el eje de la tendencia. */
function etiquetaDia(marca: number): string {
  return new Date(marca).toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

/** "sábado 4 de octubre", para el tooltip. */
function detalleDia(marca: number): string {
  return new Date(marca).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Cuenta cuántas marcas de tiempo caen en cada uno de los últimos N días.
 *
 * Se construye la rejilla completa de días y luego se rellena, en vez de
 * agrupar solo lo que existe: un día sin publicaciones es información —dice
 * que el pueblo no se movió— y si no se dibuja, la tendencia miente.
 */
function porDia(marcas: number[], ahora: number, dias: number): Punto[] {
  const hoy = inicioDelDia(ahora);
  const cuentas = new Map<number, number>();

  for (let i = dias - 1; i >= 0; i -= 1) cuentas.set(hoy - i * MS_POR_DIA, 0);

  for (const marca of marcas) {
    const dia = inicioDelDia(marca);
    const actual = cuentas.get(dia);
    if (actual !== undefined) cuentas.set(dia, actual + 1);
  }

  return [...cuentas.entries()].map(([dia, valor]) => ({
    etiqueta: etiquetaDia(dia),
    valor,
    detalle: detalleDia(dia),
  }));
}

/** Las N entradas más repetidas de una lista de textos. */
function masFrecuentes(valores: (string | undefined)[], tope: number): Punto[] {
  const cuentas = new Map<string, number>();
  for (const bruto of valores) {
    const valor = (bruto ?? "").trim();
    if (!valor) continue;
    cuentas.set(valor, (cuentas.get(valor) ?? 0) + 1);
  }
  return [...cuentas.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, tope)
    .map(([etiqueta, valor]) => ({ etiqueta, valor }));
}

/** Media de una lista de números; null si está vacía. */
function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((suma, n) => suma + n, 0) / valores.length;
}

export function calcularResumen(
  miembros: Miembro[],
  publicaciones: Publicacion[],
  ahora: number,
): Resumen {
  const hace30 = ahora - DIAS_TENDENCIA * MS_POR_DIA;
  const hace7 = ahora - 7 * MS_POR_DIA;

  // La vigencia sale de un solo sitio: si cada sección la calculara a su modo,
  // una acabaría contando como vivo lo que otra ya no enseña.
  const vigente = (p: Publicacion) => estaVigente(p, ahora);

  const autores = new Set(publicaciones.map((p) => p.autorUid));

  const ofertas = publicaciones
    .filter((p): p is PublicacionDivisa => p.tipo === "divisa")
    .filter(vigente);

  const tasasUsd = (operacion: "compra" | "venta") =>
    ofertas
      .filter((o) => (o.divisa ?? "USD") === "USD" && o.operacion === operacion)
      .map((o) => o.tasa)
      .filter((t) => Number.isFinite(t) && t > 0);

  const porMiembro = new Map<string, number>();
  for (const p of publicaciones) {
    porMiembro.set(p.autorUid, (porMiembro.get(p.autorUid) ?? 0) + 1);
  }

  const indice = new Map(miembros.map((m) => [m.uid, m]));

  return {
    miembros: {
      total: miembros.length,
      verificados: miembros.filter((m) => m.verificado).length,
      seguros: miembros.filter((m) => m.vendedorSeguro === true).length,
      esperando: miembros.filter((m) => !m.verificado && m.solicitaVerificacion === true).length,
      nuevos30: miembros.filter((m) => m.creadoEn >= hace30).length,
      nuevos7: miembros.filter((m) => m.creadoEn >= hace7).length,
      activos: miembros.filter((m) => autores.has(m.uid)).length,
    },
    publicaciones: {
      total: publicaciones.length,
      activas: publicaciones.filter(vigente).length,
      vencidas: publicaciones.filter(
        (p) => !esPermanente(p.tipo) && p.venceEn <= ahora,
      ).length,
      cerradas: publicaciones.filter((p) => p.estado === "cerrada").length,
      cerradas30: publicaciones.filter(
        (p) => p.estado === "cerrada" && (p.cerradaEn ?? 0) >= hace30,
      ).length,
      destacadas: publicaciones.filter((p) => (p.destacadaHasta ?? 0) > ahora).length,
      nuevas30: publicaciones.filter((p) => p.creadaEn >= hace30).length,
      nuevas7: publicaciones.filter((p) => p.creadaEn >= hace7).length,
      porTipo: ORDEN_TIPOS.map((tipo) => ({
        etiqueta: ETIQUETA_TIPO[tipo],
        valor: publicaciones.filter((p) => p.tipo === tipo && vigente(p)).length,
      })),
    },
    divisas: {
      ofertasVivas: ofertas.length,
      cambistas: new Set(ofertas.map((o) => o.autorUid)).size,
      tasaVentaUsd: promedio(tasasUsd("venta")),
      tasaCompraUsd: promedio(tasasUsd("compra")),
    },
    actividad: porDia(
      publicaciones.map((p) => p.creadaEn),
      ahora,
      DIAS_TENDENCIA,
    ),
    registros: porDia(
      miembros.map((m) => m.creadoEn),
      ahora,
      DIAS_TENDENCIA,
    ),
    zonas: masFrecuentes(
      publicaciones.filter(vigente).map((p) => p.zona),
      6,
    ),
    categorias: masFrecuentes(
      publicaciones
        .filter(vigente)
        .map((p) => ("categoria" in p ? p.categoria : undefined)),
      6,
    ),
    masActivos: [...porMiembro.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uid, total]) => {
        const miembro = indice.get(uid) ?? null;
        const publicacion = publicaciones.find((p) => p.autorUid === uid);
        return {
          miembro,
          nombre: miembro
            ? `${miembro.nombre} ${miembro.apellido}`
            : `${publicacion?.autorNombre ?? "Miembro"} ${publicacion?.autorApellido ?? ""}`.trim(),
          codigo: miembro?.codigo ?? publicacion?.autorCodigo ?? "",
          total,
        };
      }),
  };
}
