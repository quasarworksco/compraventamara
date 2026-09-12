"use client";

/**
 * Lectura y escritura de publicaciones en Firestore.
 *
 * Todas las listas se suscriben en vivo (`onSnapshot`): cuando alguien publica
 * un artículo o cambia su tasa del dólar, el resto del grupo lo ve sin recargar.
 */
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit as limitar,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";

import { db, firebaseListo } from "./firebase";
import { normalizarBusqueda } from "./formato";
import {
  DIAS_AVISO_VENCIMIENTO,
  DIAS_VIGENCIA,
  MS_POR_DIA,
  type Miembro,
  type Publicacion,
  type TipoPublicacion,
} from "./types";

const COLECCION = "publicaciones";

export interface OpcionesLista {
  tipo?: TipoPublicacion;
  autorUid?: string;
  /** Número máximo de documentos a traer. */
  tope?: number;
}

export interface ResultadoLista {
  publicaciones: Publicacion[];
  cargando: boolean;
  error: string | null;
}

/**
 * Suscripción en vivo a las publicaciones activas.
 *
 * El estado guarda la consulta que lo produjo. Así "está cargando" se deduce
 * comparando esa clave con la actual, en vez de escribir estado dentro del
 * efecto, que provocaría un renderizado en cascada en cada cambio de filtro.
 */
export function usePublicaciones(opciones: OpcionesLista = {}): ResultadoLista {
  const { tipo, autorUid, tope = 60 } = opciones;
  const clave = `${tipo ?? ""}|${autorUid ?? ""}|${tope}`;

  const [estado, setEstado] = useState<{
    clave: string;
    publicaciones: Publicacion[];
    error: string | null;
  }>({ clave: "", publicaciones: [], error: null });

  useEffect(() => {
    if (!firebaseListo) return;

    const restricciones: QueryConstraint[] = [];
    if (tipo) restricciones.push(where("tipo", "==", tipo));
    if (autorUid) restricciones.push(where("autorUid", "==", autorUid));
    else restricciones.push(where("estado", "==", "activa"));
    restricciones.push(orderBy("creadaEn", "desc"), limitar(tope));

    return onSnapshot(
      query(collection(db(), COLECCION), ...restricciones),
      (snapshot) => {
        setEstado({
          clave,
          publicaciones: snapshot.docs.map((d) => ({ ...(d.data() as Publicacion), id: d.id })),
          error: null,
        });
      },
      (fallo) => setEstado({ clave, publicaciones: [], error: fallo.message }),
    );
  }, [clave, tipo, autorUid, tope]);

  return {
    publicaciones: estado.clave === clave ? estado.publicaciones : [],
    cargando: firebaseListo && estado.clave !== clave,
    error: estado.error,
  };
}

/** Suscripción a una publicación concreta. */
export function usePublicacion(id: string) {
  const [estado, setEstado] = useState<{ clave: string; publicacion: Publicacion | null }>({
    clave: "",
    publicacion: null,
  });

  useEffect(() => {
    if (!firebaseListo || !id) return;
    return onSnapshot(
      doc(db(), COLECCION, id),
      (snapshot) => {
        setEstado({
          clave: id,
          publicacion: snapshot.exists()
            ? { ...(snapshot.data() as Publicacion), id: snapshot.id }
            : null,
        });
      },
      () => setEstado({ clave: id, publicacion: null }),
    );
  }, [id]);

  const resuelto = estado.clave === id;
  return {
    publicacion: resuelto ? estado.publicacion : null,
    cargando: firebaseListo && Boolean(id) && !resuelto,
  };
}

/**
 * `Omit` aplicado a cada miembro de la unión por separado.
 *
 * El `Omit` normal colapsa la unión y se pierde el discriminante `tipo`, con lo
 * que dejaría de poder distinguirse un borrador de rifa de uno de producto.
 */
type OmitirEnCadaTipo<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Campos que aporta quien publica; el resto se deriva de su perfil. */
export type BorradorPublicacion = OmitirEnCadaTipo<
  Publicacion,
  | "id"
  | "creadaEn"
  | "actualizadaEn"
  | "estado"
  | "venceEn"
  | "prorrogas"
  | "autorUid"
  | "autorCodigo"
  | "autorNombre"
  | "autorApellido"
  | "autorTelefono"
  | "autorFoto"
  | "autorVerificado"
>;

/**
 * Guarda una publicación copiando los datos del autor dentro del documento.
 * Duplicar el nombre y el teléfono evita una segunda lectura por tarjeta, que
 * en una lista de 40 artículos se nota tanto en velocidad como en cuota.
 */
/**
 * Cuánto vive cada tipo de publicación.
 *
 * Un anuncio de venta aguanta un mes; una tasa de dólar envejece en horas, así
 * que dura tres días; una rifa muere con su sorteo; y la ficha de un negocio
 * del directorio no vence mientras su dueño la mantenga.
 */
export function calcularVencimiento(
  tipo: TipoPublicacion,
  datos: { fechaSorteo?: string } = {},
): number {
  const ahora = Date.now();
  switch (tipo) {
    case "dolar":
      return ahora + 3 * MS_POR_DIA;
    case "rifa": {
      if (!datos.fechaSorteo) return ahora + DIAS_VIGENCIA * MS_POR_DIA;
      // Un día de gracia tras el sorteo para que se anuncie al ganador.
      return new Date(`${datos.fechaSorteo}T23:59:59Z`).getTime() + MS_POR_DIA;
    }
    case "negocio":
      return AÑO_2100;
    default:
      return ahora + DIAS_VIGENCIA * MS_POR_DIA;
  }
}

/** Centinela para las fichas que no vencen. */
const AÑO_2100 = new Date("2100-01-01T00:00:00Z").getTime();

/** Días que le quedan de vida a una publicación. */
export function diasDeVida(publicacion: Publicacion): number {
  return Math.ceil((publicacion.venceEn - Date.now()) / MS_POR_DIA);
}

/** Verdadero cuando toca avisar al dueño de que su anuncio está por vencer. */
export function porVencer(publicacion: Publicacion): boolean {
  if (publicacion.tipo === "negocio") return false;
  const dias = diasDeVida(publicacion);
  return dias <= DIAS_AVISO_VENCIMIENTO && dias > 0;
}

export function estaVencida(publicacion: Publicacion): boolean {
  return publicacion.tipo !== "negocio" && publicacion.venceEn <= Date.now();
}

/**
 * Prórroga: devuelve la publicación a los 30 días completos de vigencia.
 * La pide el dueño desde su perfil cuando el sistema le avisa.
 */
export async function prorrogarPublicacion(publicacion: Publicacion): Promise<void> {
  await updateDoc(doc(db(), COLECCION, publicacion.id), {
    venceEn: Date.now() + DIAS_VIGENCIA * MS_POR_DIA,
    prorrogas: (publicacion.prorrogas ?? 0) + 1,
    estado: "activa",
    actualizadaEn: Date.now(),
  });
}

export async function crearPublicacion(
  borrador: BorradorPublicacion,
  autor: Miembro,
): Promise<string> {
  const ahora = Date.now();
  const referencia = await addDoc(collection(db(), COLECCION), {
    ...borrador,
    estado: "activa",
    creadaEn: ahora,
    actualizadaEn: ahora,
    venceEn: calcularVencimiento(
      borrador.tipo,
      borrador.tipo === "rifa" ? { fechaSorteo: borrador.fechaSorteo } : {},
    ),
    prorrogas: 0,
    autorUid: autor.uid,
    autorCodigo: autor.codigo,
    autorNombre: autor.nombre,
    autorApellido: autor.apellido,
    autorTelefono: autor.telefono,
    autorFoto: autor.fotoUrl,
    autorVerificado: autor.verificado,
  });
  return referencia.id;
}

export async function cambiarEstadoPublicacion(
  id: string,
  estado: Publicacion["estado"],
): Promise<void> {
  await updateDoc(doc(db(), COLECCION, id), { estado, actualizadaEn: Date.now() });
}

export async function borrarPublicacion(id: string): Promise<void> {
  await deleteDoc(doc(db(), COLECCION, id));
}

/**
 * Filtra en el navegador por texto y categoría.
 *
 * Firestore no hace búsqueda por texto libre, y montar Algolia para un grupo
 * de barrio sería desproporcionado: con los últimos cientos de anuncios en
 * memoria, filtrar aquí es instantáneo.
 */
export function useFiltro(
  publicaciones: Publicacion[],
  texto: string,
  categoria?: string,
): Publicacion[] {
  return useMemo(() => {
    const busqueda = normalizarBusqueda(texto.trim());
    return publicaciones.filter((p) => {
      if (categoria && "categoria" in p && p.categoria !== categoria) return false;
      if (!busqueda) return true;
      const heno = normalizarBusqueda(
        `${p.titulo} ${p.descripcion} ${p.zona} ${p.autorNombre} ${p.autorApellido}`,
      );
      return busqueda.split(/\s+/).every((palabra) => heno.includes(palabra));
    });
  }, [publicaciones, texto, categoria]);
}
